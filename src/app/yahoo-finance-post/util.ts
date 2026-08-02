// note.com の記事HTML生成と、Yahoo!ファイナンス掲示板URLの解析をまとめたユーティリティ

export type NoteHtml = {
  html: string;
  length: number;
};

// noteマネー（株価チャート）の埋め込み対象 URL
const MONEY_URL_PATTERN = /^https?:\/\/money\.note\.com\/(companies|us-companies|indices|investments)\/[\w-]+\/?$/;

// 引用は Markdown と同じ `> ` 記法。連続行が 1 つの引用ブロックになる
const QUOTE_PATTERN = /^>\s?(.*)$/;
// 引用内の `— 出典` 行は figcaption（出典）になる。`— 出典 (URL)` でリンク化できる
const CITATION_PATTERN = /^—\s*(.+)$/;
const CITATION_URL_PATTERN = /^(.+?)\s+\((\S+)\)$/;
const URL_PATTERN = /^https?:\/\/\S+$/;

// Yahoo!ファイナンス掲示板URL 例: https://finance.yahoo.co.jp/quote/285A.T/forum/1772641
const YAHOO_FORUM_PATTERN = /^https?:\/\/finance\.yahoo\.co\.jp\/quote\/([\w.-]+)\//;

export const isYahooForumUrl = (url: string): boolean => YAHOO_FORUM_PATTERN.test(url.trim());

// `285A.T` のような銘柄コードから市場サフィックスを除いた証券コードを取り出す
export const extractStockCode = (url: string): string | null => {
  const matched = url.trim().match(YAHOO_FORUM_PATTERN);
  if (!matched) return null;

  const code = matched[1].split('.')[0];
  if (code.length === 0) return null;

  return code;
};

// スクレイピングしたコメントはそのままHTMLに埋め込むためエスケープする
export const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// 埋め込みは figure 要素で表現する。embedded-content-key はこの時点では仮の値
const toEmbedFigure = (url: string): string => {
  const uid = crypto.randomUUID();
  const placeholder = `emb${crypto.randomUUID().replaceAll('-', '').slice(0, 13)}`;

  return `<figure name="${uid}" id="${uid}" data-src="${url}" data-identifier="null" embedded-service="oembed" embedded-content-key="${placeholder}"></figure>`;
};

// 出典テキストを figcaption の中身に変換する
// `テキスト (URL)` はリンク付き、URL 単体は URL 自体をリンク文字列にする（note エディタと同じ挙動）
const toCaptionHtml = (citation: string): string => {
  const withUrl = citation.match(CITATION_URL_PATTERN);
  if (withUrl) {
    return `<a href="${withUrl[2]}" target="_blank" rel="nofollow noopener">${withUrl[1]}</a>`;
  }
  if (URL_PATTERN.test(citation)) {
    return `<a href="${citation}" target="_blank" rel="nofollow noopener">${citation}</a>`;
  }
  return citation;
};

// 引用は figure > blockquote > p の入れ子。blockquote には name / id を付けない
const toQuoteFigure = (quoteLines: string[], citation: string): string => {
  const uid = crypto.randomUUID();
  const paragraphs = quoteLines
    .map((line) => {
      const lineUid = crypto.randomUUID();
      return `<p name="${lineUid}" id="${lineUid}">${line}</p>`;
    })
    .join('');
  // 出典なしの場合、note エディタは figcaption 自体を出力しない
  const caption = citation ? `<figcaption>${toCaptionHtml(citation)}</figcaption>` : '';

  return `<figure name="${uid}" id="${uid}"><blockquote>${paragraphs}</blockquote>${caption}</figure>`;
};

// note のエディタは各ブロックに name / id 属性（uuid）を持つ独自 HTML を要求する
export const toNoteHtml = (text: string): NoteHtml => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const parts: string[] = [];
  let length = 0;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const quote = line.match(QUOTE_PATTERN);

    // 連続する `> ` 行をまとめて 1 つの引用ブロックにする
    if (quote) {
      const quoteLines: string[] = [];
      let citation = '';

      while (index < lines.length) {
        const current = lines[index].match(QUOTE_PATTERN);
        if (!current) break;

        const content = current[1].trim();
        index += 1;
        if (content.length === 0) continue;

        const cited = content.match(CITATION_PATTERN);
        if (cited) {
          citation = cited[1].trim();
          continue;
        }
        quoteLines.push(content);
      }

      parts.push(toQuoteFigure(quoteLines, citation));
      length += quoteLines.reduce((sum, quoteLine) => sum + quoteLine.length, 0) + citation.length;
      continue;
    }

    index += 1;
    length += line.length;

    const uid = crypto.randomUUID();
    if (MONEY_URL_PATTERN.test(line)) {
      parts.push(toEmbedFigure(line));
      continue;
    }

    parts.push(`<p name="${uid}" id="${uid}">${line}</p>`);
  }

  return { html: parts.join(''), length };
};
