// 表示用テキストから TTS に渡す発話用テキストを作る。表示側には影響させない

// 文末とみなす記号。これで終わらない行には「。」を補い、行同士が一続きに読まれないようにする
const SENTENCE_END = /[。!?！？…]$/;

const stripMarkdown = (text: string) =>
  text
    // コードブロックは読まない
    .replace(/```[\s\S]*?(```|$)/g, '\n')
    // 画像は丸ごと、リンクは表示文字だけ残す
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // URL は TTS で崩壊するので除去する
    .replace(/https?:\/\/\S+/g, '')
    // インラインコードは中身だけ読む
    .replace(/`([^`]*)`/g, '$1')
    // 表の区切り行と罫線
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, '')
    .replace(/\|/g, ' ')
    // 行頭の見出し・引用・箇条書き・番号付きリスト
    .replace(/^\s*(#{1,6}|>+|[-*+]|\d+\.)\s+/gm, '')
    // 強調・打ち消し
    .replace(/\*\*|__|~~|\*/g, '');

const normalizeLaughAndEllipsis = (text: string) =>
  text
    // NFKC で「…」が「...」に分解されるので戻し、連続は 1 つにまとめる
    .replace(/\.{2,}/g, '…')
    .replace(/…+/g, '…')
    // 「…そう。」を単独で合成すると「くそ」に聞こえることがあるため、文頭の「…」は除去する
    .replace(/(^|[。!?\n])[\s…]+/g, '$1')
    .replace(/\(笑\)/g, '')
    // 日本語や「!?」の直後の「w」「www」は笑いの表現とみなして除去する
    .replace(/(?<=\P{ASCII}|[!?])w+(?=[\s。!?、…]|$)/gmu, '');

const removeEmoji = (text: string) =>
  text
    // 絵文字本体に加え、異体字セレクタ・ZWJ・キーキャップ・肌色修飾子も除去する
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u{FE0E}|\u{FE0F}|\u{200D}|\u{20E3}/gu, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '');

const joinLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '')
    // 末尾の「、」は推定音声長が伸びてゴミ音声の原因になるため「。」に置き換える
    .map((line) => (SENTENCE_END.test(line) ? line : `${line.replace(/[、,]+$/, '')}。`))
    .join('');

export const toSpeechText = (text: string) => {
  const normalized = text.normalize('NFKC').replace(/\r\n?/g, '\n');
  return joinLines(normalizeLaughAndEllipsis(removeEmoji(stripMarkdown(normalized))));
};

// 括弧・句読点・記号だけの断片は発話しない
export const isSpeakableText = (text: string) => /[\p{L}\p{N}]/u.test(text);
