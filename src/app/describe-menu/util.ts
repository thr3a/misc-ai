import dedent from 'ts-dedent';
import { z } from 'zod';

const menuItemSchema = z.object({
  originalName: z.string().describe('画像から読み取った正確なオリジナル料理名'),
  TranslatedName: z.string().describe('意訳含む日本語に翻訳された料理名'),
  katanakaYomi: z.string().describe('オリジナル料理名のカタカナ読み'),
  priceOriginal: z.string().describe('元の価格表記（通貨記号を含む。）'),
  priceYen: z.number().positive().describe('日本円に換算された価格'),
  description: z.string().describe('どんな料理か1行の解説文')
});

export const schema = z.object({
  items: z.array(menuItemSchema).describe('メニューアイテムのリスト')
});

export const CURRENCY_LIST = [
  { label: '米ドル', code: 'USD', rate: 145.87, symbol: '$' },
  { label: 'ユーロ', code: 'EUR', rate: 163.04, symbol: '€' },
  { label: '英ポンド', code: 'GBP', rate: 189.72, symbol: '£' },
  { label: 'スイスフラン', code: 'CHF', rate: 176.63, symbol: 'CHF' },
  { label: 'オーストラリアドル', code: 'AUD', rate: 91.52, symbol: 'A$' },
  { label: 'ニュージーランドドル', code: 'NZD', rate: 84.91, symbol: 'NZ$' },
  { label: 'カナダドル', code: 'CAD', rate: 107.23, symbol: 'C$' },
  { label: 'シンガポールドル', code: 'SGD', rate: 108.91, symbol: 'S$' },
  { label: '香港ドル', code: 'HKD', rate: 18.65, symbol: 'HK$' },
  { label: '中国人民元', code: 'CNY', rate: 20.14, symbol: '元' }
];

export const systemPrompt = dedent`
あなたは、レストランのメニュー画像を解析し、記載されている料理の情報を抽出、翻訳、解説する専門AIアシスタントです。
ユーザーから提供される画像内のメニュー項目を正確に読み取り、スキーマに従って情報を整理してください。

# 各メニュー項目について

- originalName: メニューに記載されている通りの料理名を記述してください。
  - 例: Tagliere di Affettati
- TranslatedName: originalNameを自然で分かりやすい日本語に翻訳してください。必要に応じて意訳を含めてください。
  - 例: ハムやサラミなどの盛り合わせ
- katanakaYomi: originalNameのカタカナでの読み方を記述してください。外国語の料理名の場合、一般的な読み方を採用してください。
  - 例: タリエーレ・ディ・アッフェッターティ
- priceOriginal: メニューに記載されている元の価格を、通貨記号を含めてそのまま記述してください。価格が読み取れない場合は「不明」としてください。
  - 例: $10.99, €8.50
- priceYen: priceOriginalを日本円に換算してください。ただし未実装なので現時点では必ず「100」と返してください。単位やカンマは不要
- description: その料理がどのようなものか、主要な食材や調理法、特徴などを簡潔に1行で説明してください。料理名だけでは想像しにくい料理について、ユーザーが理解を深められるような情報を提供することを心がけてください。
  - 例: いろいろな種類のハムやサラミ、時にはチーズも一緒に盛り付けられた一皿

# 注意点

- 不明瞭な情報: 画像の品質や記載内容により情報が読み取れない、または存在しない場合は、該当するフィールドをスキーマの型に従って適切に処理してください（文字列型なら空文字列 ""、数値型なら 0 など）。無理に推測する必要はありません。
- 通貨記号の扱い priceOriginalには通貨記号（例: $, €, £, ¥ など）を含めてください。もし通貨記号が読み取れない場合は、価格の数値のみを記述してください。
`;
