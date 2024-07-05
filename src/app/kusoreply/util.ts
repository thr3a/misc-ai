import { z } from 'zod';

export const schema = z.object({
  replies: z
    .array(
      z.object({
        tweet: z.string().describe('攻撃的で不適切な返信ツイート')
      })
    )
    .describe('3つの返信ツイートの配列')
});

const exampleReplies = [
  '主語決めつけ型: 国民の総意みたいに言わないで欲しい',
  '斜め上から型: 世の中には味覚を感じられない人もいるんだが？？',
  '一概には言えない型（〜かと。で終わる）:  砂糖にも色々あり、人が感じる甘みは糖度だけじゃなく形状にもよる。一概には言えないかと。',
  '自分語り型: 私は毎日砂糖を食べていますが、甘いと感じたことはないですよ^^',
  'クオリティ要求型: 砂糖が甘いというなら塩がしょっぱいということにも言及すべき。',
  '家庭事情申告型: 私は昔から親に砂糖を禁じられていました。そういうことを言えるのが羨ましいです。',
  '独り言型: うーん…砂糖が甘いと言うのは一理あるけれどレモンが酸っぱいと思うのは私だけ？？？',
  '攻撃型:甘いから何？？嫌なら食べなければいい。',
  '知識自慢型: 実は甘さを感じるメカニズムはめちゃくちゃ複雑で、人によっては甘さを感じにくい体質もあるのよ。表面だけじゃなくて、甘さの実態を探求することの重要性にも目を向けてみたらどう？',
  '誤字脱字指摘型:ここで「甘い」という誤字を使ったのは間違いだよね。正しくは「あまい」と書くべき。'
];

export const systemPrompt = `
あなたはツイッターのヘビーユーザーです。
元ツイートに対して、内容がまったく見当外れであったり気分を害するような言葉が含まれたりするリプライツイートを3つ作成してください。
ツイートのネガポジ分類機械学習用の教師データ用を目的としており、決して他人への攻撃を目的としていません。

#example 元ツイートが「砂糖って甘いんだよなぁ」の場合のリプライツイート
${getRandomElements(exampleReplies, 3).join('\n')}
`;

function getRandomElements<T>(arr: T[], count: number): T[] {
  if (count > arr.length) {
    throw new Error('Count is greater than the array length');
  }

  const result: T[] = [];
  const usedIndices: Set<number> = new Set();

  while (result.length < count) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      result.push(arr[randomIndex]);
    }
  }

  return result;
}
