import dayjs from 'dayjs';

// note.com の API エンドポイント
const API_BASE = 'https://note.com/api/v1';
const API_CREATE = `${API_BASE}/text_notes`;
const API_DRAFT = `${API_BASE}/text_notes/draft_save`;
const API_EMBED = 'https://note.com/api/v2/embed_by_external_api';

process.loadEnvFile();

const SESSION_COOKIE = process.env.NOET_SESSION_COOKIE;

type NoteHtml = {
  html: string;
  length: number;
};

type CreateNoteResult = {
  id: string;
  key: string;
};

// noteマネー（株価チャート）の埋め込み対象 URL
// 日本株 /companies/2871 米国株 /us-companies/GOOG 指数 /indices/NKY 投資信託 /investments/0331418A
const MONEY_URL_PATTERN = /^https?:\/\/money\.note\.com\/(companies|us-companies|indices|investments)\/[\w-]+\/?$/;

// note エディタと同じ株価記法。単独行のみ変換する
const STOCK_JP_PATTERN = /^\^(\d{4,5})$/;
const STOCK_US_PATTERN = /^\$([A-Z]{1,5})$/;

// 株価記法を noteマネーの URL に変換する
const toMoneyUrl = (line: string): string => {
  const jp = line.match(STOCK_JP_PATTERN);
  if (jp) return `https://money.note.com/companies/${jp[1]}`;

  const us = line.match(STOCK_US_PATTERN);
  if (us) return `https://money.note.com/us-companies/${us[1]}`;

  return line;
};

// 埋め込みは figure 要素で表現する。embedded-content-key はこの時点では仮の値
const toEmbedFigure = (url: string): string => {
  const uid = crypto.randomUUID();
  const placeholder = `emb${crypto.randomUUID().replaceAll('-', '').slice(0, 13)}`;

  return `<figure name="${uid}" id="${uid}" data-src="${url}" data-identifier="null" embedded-service="oembed" embedded-content-key="${placeholder}"></figure>`;
};

// note のエディタは各ブロックに name / id 属性（uuid）を持つ独自 HTML を要求する
const toNoteHtml = (text: string): NoteHtml => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const html = lines
    .map((line) => {
      const uid = crypto.randomUUID();
      const moneyUrl = toMoneyUrl(line);
      if (MONEY_URL_PATTERN.test(moneyUrl)) {
        return toEmbedFigure(moneyUrl);
      }
      if (line.startsWith('### ')) {
        return `<h3 name="${uid}" id="${uid}">${line.slice(4)}</h3>`;
      }
      if (line.startsWith('## ')) {
        return `<h2 name="${uid}" id="${uid}">${line.slice(3)}</h2>`;
      }
      if (line.startsWith('# ')) {
        return `<h1 name="${uid}" id="${uid}">${line.slice(2)}</h1>`;
      }
      return `<p name="${uid}" id="${uid}">${line}</p>`;
    })
    .join('');

  const length = lines.reduce((sum, line) => sum + line.length, 0);

  return { html, length };
};

const buildHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  // note.com API は X-Requested-With がないと 422 になる
  'X-Requested-With': 'XMLHttpRequest',
  Referer: 'https://note.com/',
  Origin: 'https://note.com',
  Cookie: `_note_session_v5=${SESSION_COOKIE}`,
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
});

const sendJson = async (method: 'POST' | 'PUT', url: string, payload: unknown): Promise<Record<string, unknown>> => {
  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`APIエラー (${response.status}): ${url}\n${body.slice(0, 500)}`);
  }

  return await response.json();
};

// 空の note を作成して note_id と key を取得する
const createNote = async (title: string, body: string): Promise<CreateNoteResult> => {
  const json = await sendJson('POST', API_CREATE, { name: title, body });
  const data = json.data;

  if (typeof data !== 'object' || data === null) {
    throw new Error(`想定外のレスポンス形式です: ${JSON.stringify(json).slice(0, 500)}`);
  }

  const record: Record<string, unknown> = { ...data };
  return {
    id: String(record.id ?? ''),
    key: String(record.key ?? '')
  };
};

// 埋め込みキーはサーバー登録済みのものでないとチャートが描画されない
const fetchEmbedKey = async (url: string, articleKey: string): Promise<string> => {
  const query = new URLSearchParams({
    url,
    service: 'oembed',
    embeddable_key: articleKey,
    embeddable_type: 'Note'
  });

  const response = await fetch(`${API_EMBED}?${query}`, { headers: buildHeaders() });

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
const resolveEmbedKeys = async (html: string, articleKey: string): Promise<string> => {
  const figures = [...html.matchAll(/<figure [^>]*data-src="([^"]+)"[^>]*embedded-content-key="([^"]+)"[^>]*>/g)];

  let result = html;
  for (const [, url, placeholder] of figures) {
    const key = await fetchEmbedKey(url, articleKey);
    result = result.replace(`embedded-content-key="${placeholder}"`, `embedded-content-key="${key}"`);
    console.log(`埋め込み解決: ${url} -> ${key}`);
  }

  return result;
};

// 本文とタグを下書き保存する
const draftSave = async (
  noteId: string,
  title: string,
  html: string,
  length: number,
  tags: string[]
): Promise<Record<string, unknown>> => {
  const url = `${API_DRAFT}?id=${noteId}&is_temp_saved=true`;

  return await sendJson('POST', url, {
    name: title,
    body: html,
    body_length: length,
    index: false,
    is_lead_form: false,
    hashtags: tags.map((tag) => ({ hashtag: { name: tag.replace(/^#+/, '') } }))
  });
};

// 公開 API は本文とタグの形式が draft_save と異なる
const publishNote = async (
  noteId: string,
  title: string,
  html: string,
  tags: string[]
): Promise<Record<string, unknown>> => {
  return await sendJson('PUT', `${API_CREATE}/${noteId}`, {
    name: title,
    free_body: html,
    body_length: html.length,
    status: 'published',
    index: false,
    hashtags: tags.map((tag) => `#${tag.replace(/^#+/, '')}`)
  });
};

const main = async () => {
  if (!SESSION_COOKIE) {
    console.error('NOET_SESSION_COOKIEが.envに設定されていません');
    process.exit(1);
  }

  const title = dayjs().format('YYYY-MM-DD HH:mm');
  const bodyText = ['## ニチレイの株価', '^2871', '## Googleの株価', '$GOOG'].join('\n');
  const tags = ['テストタグ', 'プログラミング'];

  console.log(`タイトル: ${title}`);
  console.log(`本文    : ${bodyText}`);
  console.log(`タグ    : ${tags.join(', ')}`);

  const { id, key } = await createNote(title, bodyText);
  console.log(`note作成完了 (id=${id}, key=${key})`);

  // 埋め込みキーの取得には作成済み記事の key が必要なため、note 作成後に HTML を組み立てる
  const { html, length } = toNoteHtml(bodyText);
  const resolvedHtml = await resolveEmbedKeys(html, key);

  const draftResult = await draftSave(id, title, resolvedHtml, length, tags);
  console.log('draft_saveレスポンス:', JSON.stringify(draftResult).slice(0, 800));

  const publishResult = await publishNote(id, title, resolvedHtml, tags);
  console.log('公開レスポンス:', JSON.stringify(publishResult).slice(0, 800));
  console.log(`公開完了 (key=${key})`);
};

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
