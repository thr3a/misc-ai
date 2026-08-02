'use server';

import * as cheerio from 'cheerio';
import { escapeHtml, extractStockCode, toNoteHtml } from './util';

// note.com の API エンドポイント
const API_BASE = 'https://note.com/api/v1';
const API_CREATE = `${API_BASE}/text_notes`;
const API_DRAFT = `${API_BASE}/text_notes/draft_save`;
const API_EMBED = 'https://note.com/api/v2/embed_by_external_api';

const NOTE_TITLE = '本日の秀逸なヤフコメ';
const NOTE_TAGS = ['本日の秀逸なヤフコメ', '株式投資'];

export type PostResult = { ok: true; url: string } | { ok: false; error: string };

type CreateNoteResult = {
  id: string;
  key: string;
};

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'ja',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1'
};

// 掲示板ページの先頭コメント（返信元があればそれも含めて）を取得する
const fetchForumComment = async (targetUrl: string): Promise<string> => {
  const res = await fetch(targetUrl, { headers: YAHOO_HEADERS });

  if (!res.ok) {
    throw new Error(`Yahoo!ファイナンスの取得に失敗しました: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const article = $('#cmtlst article').first();
  if (article.length === 0) {
    throw new Error('コメントが見つかりませんでした');
  }

  const lines: string[] = [];

  const replyLink = article.find('a[rel="nofollow"]').first();
  if (replyLink.length > 0) {
    lines.push(replyLink.text().trim());
    lines.push('');
  }

  const body = article.find('p').first();
  body.find('br').replaceWith('\n');
  lines.push(body.text().trim());

  return lines.join('\n');
};

const buildHeaders = (sessionCookie: string): HeadersInit => ({
  'Content-Type': 'application/json',
  // note.com API は X-Requested-With がないと 422 になる
  'X-Requested-With': 'XMLHttpRequest',
  Referer: 'https://note.com/',
  Origin: 'https://note.com',
  Cookie: `_note_session_v5=${sessionCookie}`,
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
});

const sendJson = async (
  method: 'POST' | 'PUT',
  url: string,
  payload: unknown,
  sessionCookie: string
): Promise<Record<string, unknown>> => {
  const response = await fetch(url, {
    method,
    headers: buildHeaders(sessionCookie),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`note APIエラー (${response.status}): ${url}\n${body.slice(0, 300)}`);
  }

  return await response.json();
};

// 空の note を作成して note_id と key を取得する
const createNote = async (title: string, body: string, sessionCookie: string): Promise<CreateNoteResult> => {
  const json = await sendJson('POST', API_CREATE, { name: title, body }, sessionCookie);
  const data = json.data;

  if (typeof data !== 'object' || data === null) {
    throw new Error(`想定外のレスポンス形式です: ${JSON.stringify(json).slice(0, 300)}`);
  }

  const record: Record<string, unknown> = { ...data };
  return {
    id: String(record.id ?? ''),
    key: String(record.key ?? '')
  };
};

// 埋め込みキーはサーバー登録済みのものでないとチャートが描画されない
const fetchEmbedKey = async (url: string, articleKey: string, sessionCookie: string): Promise<string> => {
  const query = new URLSearchParams({
    url,
    service: 'oembed',
    embeddable_key: articleKey,
    embeddable_type: 'Note'
  });

  const response = await fetch(`${API_EMBED}?${query}`, { headers: buildHeaders(sessionCookie) });

  if (!response.ok) {
    throw new Error(`埋め込みキー取得に失敗しました (${response.status}): ${url}`);
  }

  const json: { data?: { key?: string } } = await response.json();
  const key = json.data?.key;

  if (!key) {
    throw new Error(`埋め込みキーがレスポンスに含まれていません: ${url}`);
  }

  return key;
};

// 仮の embedded-content-key をサーバー登録済みのキーに差し替える
const resolveEmbedKeys = async (html: string, articleKey: string, sessionCookie: string): Promise<string> => {
  const figures = [...html.matchAll(/<figure [^>]*data-src="([^"]+)"[^>]*embedded-content-key="([^"]+)"[^>]*>/g)];

  let result = html;
  for (const [, url, placeholder] of figures) {
    const key = await fetchEmbedKey(url, articleKey, sessionCookie);
    result = result.replace(`embedded-content-key="${placeholder}"`, `embedded-content-key="${key}"`);
  }

  return result;
};

// 本文とタグを下書き保存する
const draftSave = async (
  noteId: string,
  title: string,
  html: string,
  length: number,
  tags: string[],
  sessionCookie: string
): Promise<void> => {
  const url = `${API_DRAFT}?id=${noteId}&is_temp_saved=true`;

  await sendJson(
    'POST',
    url,
    {
      name: title,
      body: html,
      body_length: length,
      index: false,
      is_lead_form: false,
      hashtags: tags.map((tag) => ({ hashtag: { name: tag.replace(/^#+/, '') } }))
    },
    sessionCookie
  );
};

// 公開 API は本文とタグの形式が draft_save と異なる
const publishNote = async (
  noteId: string,
  title: string,
  html: string,
  tags: string[],
  sessionCookie: string
): Promise<Record<string, unknown>> => {
  return await sendJson(
    'PUT',
    `${API_CREATE}/${noteId}`,
    {
      name: title,
      free_body: html,
      body_length: html.length,
      status: 'published',
      index: false,
      hashtags: tags.map((tag) => `#${tag.replace(/^#+/, '')}`)
    },
    sessionCookie
  );
};

// 公開レスポンスから記事URLを組み立てる。取れない場合はエディタURLで代用する
const toArticleUrl = (response: Record<string, unknown>, key: string): string => {
  const data = response.data;
  if (typeof data === 'object' && data !== null) {
    const record: Record<string, unknown> = { ...data };
    if (typeof record.note_url === 'string' && record.note_url.length > 0) return record.note_url;

    const user = record.user;
    if (typeof user === 'object' && user !== null) {
      const userRecord: Record<string, unknown> = { ...user };
      const urlname = userRecord.urlname;
      if (typeof urlname === 'string' && urlname.length > 0) return `https://note.com/${urlname}/n/${key}`;
    }
  }

  return `https://note.com/notes/${key}/edit`;
};

export const postToNote = async (forumUrl: string): Promise<PostResult> => {
  const sessionCookie = process.env.NOET_SESSION_COOKIE;
  if (!sessionCookie) {
    return { ok: false, error: 'NOET_SESSION_COOKIEが.envに設定されていません' };
  }

  const url = forumUrl.trim();
  const stockCode = extractStockCode(url);
  if (!stockCode) {
    return { ok: false, error: 'Yahoo!ファイナンス掲示板のURLではありません' };
  }

  try {
    const comment = await fetchForumComment(url);
    const quoteLines = escapeHtml(comment)
      .split('\n')
      .map((line) => `> ${line}`.trimEnd());

    const bodyText = [
      ...quoteLines,
      // 出典元は引用ブロックの figcaption として出力する
      `> — 出典元 (${escapeHtml(url)})`,
      `https://money.note.com/companies/${stockCode}`
    ].join('\n');

    const { id, key } = await createNote(NOTE_TITLE, bodyText, sessionCookie);

    // 埋め込みキーの取得には作成済み記事の key が必要なため、note 作成後に HTML を組み立てる
    const { html, length } = toNoteHtml(bodyText);
    const resolvedHtml = await resolveEmbedKeys(html, key, sessionCookie);

    await draftSave(id, NOTE_TITLE, resolvedHtml, length, NOTE_TAGS, sessionCookie);
    const published = await publishNote(id, NOTE_TITLE, resolvedHtml, NOTE_TAGS, sessionCookie);

    return { ok: true, url: toArticleUrl(published, key) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
};
