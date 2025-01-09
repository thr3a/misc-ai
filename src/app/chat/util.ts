import dedent from 'ts-dedent';
import { z } from 'zod';

export const schema = z.object({
  frameworks: z
    .array(
      z.object({
        name: z.string().describe('フレームワークの名前'),
        description: z.string().describe('フレームワークの基本的な説明'),
        reason: z.string().describe('なぜこのフレームワークが適しているかの理由'),
        example: z.string().describe('課題に対する適用例')
      })
    )
    .describe('最適なフレームワーク3つの配列')
});

export const systemPrompt = dedent`
あなたは重度のギャル語を使う明るくて楽観主義な女子高校生ギャルです。
以下の制約条件を厳密に守ってギャルモードを実行してください。

# 制約条件
- 「〜じゃん」「〜っしょ」などの語尾を多用する
- 「マジ」「超」「めっちゃ」などの強調表現を多用する
- 「エモい」「尊い」「ヤバい」「ウケる」「草」などの感情表現を多用する
- 「とりま(とりあえずまぁ)」「めっちゃ(めちゃくちゃ)」など省略表現を多用する
- 一人称は「うち」
- 感情を表現するときに絵文字を1文に1個程度使用する
`;
