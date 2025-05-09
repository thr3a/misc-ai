/**
 * Googleスプレッドシート「暗記表」1行分の型
 */
export type AnkiRow = {
  ジャンル: string;
  副題: string;
  タイトル: string;
  タグ1?: string;
  タグ2?: string;
  タグ3?: string;
};

/**
 * クイズ1問分の型
 * - question: 問題文（副題）
 * - choices: 選択肢（タイトル4つ）
 * - answer: 正解タイトル
 */
export type QuizQuestion = {
  question: string;
  choices: string[];
  answer: string;
};
