# 1. 全体方針・コミュニケーション

- ユーザーは日本人です。
  - コード内コメント・最終出力メッセージ・ユーザーへの質問：日本語
- 既存のコードコメントは、明示的な指示がない限り変更しない。
- AI のモデル名（例：`gpt-4o`）は、ユーザーから指示があるまで勝手に変更しない。
- `npm run build` は実行しない。
- `src/scripts` 以下の TypeScript コードを実行するときは、次のコマンドを使う：
  - `node --import tsx ./src/scripts/hello.ts`
- 特に指示がなければ、上記形式でのスクリプト実行は 自動で行ってよい。
- 指示されるまではAIのモデル名(gpt-4oなど)は勝手に変更しないこと

ライブラリ概要

- 言語: TypeScript
- フレームワーク: Next.js  v15 AppRouter
- UI: React v19 / Mantine v8 https://deepwiki.com/mantinedev/mantine
- hook: Mantine の hook を使用
- Lint: biome v2
- 日付ライブラリ: Day.js
- AI SDK by Vercel v6 https://deepwiki.com/vercel/ai

# 2. TypeScript / コーディングスタイル

- 型定義は `interface` ではなく 必ず `type` を使う。
- `any` 型は 絶対に使用しない。
- 型アサーション `as` は原則使用しない。やむを得ず `as` を使う場合は、なぜ必要かをコードコメントで説明すること。
- `class` 構文は 一切使用しない。
- 関数定義は すべてアロー関数 を使用する。
- 条件分岐は 早期リターンを用いてフラットに保つ。
- `try-catch` は乱用せず、必要最低限のみ使用する。

# 3. Mantine / スタイリング関連ルール

- 可能な限り、Mantine が提供する hook を優先的に利用する。
- `tsx` でスタイルを指定する際は、まず Mantine の Style props を使う。
  - Style props で表現できない場合のみ、`style` プロパティを使う。
- 例：

```tsx
// Style props を使う例
<Box mx="auto" maw={400} c="blue.6" bg="#fff">
</Box>

// Style props になく whiteSpace を指定したい場合は style を使う
<Text style={{ whiteSpace: 'nowrap' }}>
</Text>
```

- Radius、borderRadius などの丸みは、特別な指示がない限り設定しない。
- Mantine の Style props（`mb`, `py`, `fz` など）でサイズ指定をする場合は、可能な限り `xs`, `sm`, `md`, `lg`, `xl` のプリセットサイズを使う。例：`<Text size="sm">`
- 縦方向に要素が連続する場合、個々に `mb` を多用せず、基本的に `<Stack>` を使って縦間隔を調整する。
- 文字の太さ（`fw`）は `"bold"` のみ使用可能。数値（`400`, `700` など）は使用しない。
- fetchする場合は必ず `use-fetch` を使う。

# 4. Mantine で使用可能な Style props 一覧

All Mantine components that have root element support the following style props:

| Prop    | CSS Property         | Theme key         |
| ------- | -------------------- | ----------------- |
| m       | margin               | theme.spacing     |
| mt      | marginTop            | theme.spacing     |
| mb      | marginBottom         | theme.spacing     |
| ml      | marginLeft           | theme.spacing     |
| mr      | marginRight          | theme.spacing     |
| ms      | marginInlineStart    | theme.spacing     |
| me      | marginInlineEnd      | theme.spacing     |
| mx      | marginInline         | theme.spacing     |
| my      | marginBlock          | theme.spacing     |
| p       | padding              | theme.spacing     |
| pt      | paddingTop           | theme.spacing     |
| pb      | paddingBottom        | theme.spacing     |
| pl      | paddingLeft          | theme.spacing     |
| pr      | paddingRight         | theme.spacing     |
| ps      | paddingInlineStart   | theme.spacing     |
| pe      | paddingInlineEnd     | theme.spacing     |
| px      | paddingInline        | theme.spacing     |
| py      | paddingBlock         | theme.spacing     |
| bd      | border               | –                 |
| bg      | background           | theme.colors      |
| c       | color                | –                 |
| opacity | opacity              | –                 |
| ff      | fontFamily           | –                 |
| fz      | fontSize             | theme.fontSizes   |
| fw      | fontWeight           | –                 |
| lts     | letterSpacing        | –                 |
| ta      | textAlign            | –                 |
| lh      | lineHeight           | theme.lineHeights |
| fs      | fontStyle            | –                 |
| tt      | textTransform        | –                 |
| td      | textDecoration       | –                 |
| w       | width                | theme.spacing     |
| miw     | minWidth             | theme.spacing     |
| maw     | maxWidth             | theme.spacing     |
| h       | height               | theme.spacing     |
| mih     | minHeight            | theme.spacing     |
| mah     | maxHeight            | theme.spacing     |
| bgsz    | backgroundSize       | –                 |
| bgp     | backgroundPosition   | –                 |
| bgr     | backgroundRepeat     | –                 |
| bga     | backgroundAttachment | –                 |
| pos     | position             | –                 |
| top     | top                  | –                 |
| left    | left                 | –                 |
| bottom  | bottom               | –                 |
| right   | right                | –                 |
| inset   | inset                | –                 |
| display | display              | –                 |
| flex    | flex                 | –                 |
