# MOSS-Image Layout プロンプト仕様

MOSS-Image（OpenMOSS）の Layout プロンプトについて、以下の資料をもとに日本語でまとめる。

- 公式スキル `.agents/skills/moss-image-prompt-enhancer`（`SKILL.md` / `references/layout.md` / `scripts/compile_prompt.py`）
- 公式 USERGUIDE の「Layout Prompts（実験的機能）」節
- 参考実装: `ComfyUI-MOSS-Layout-UI` / `Comfyui-Moss-LayoutPrompt` / `ComfyUI-MOSSLayout`

> Layout は公式でも **Experimental（実験的機能）** の扱い。

---

## 1. 全体像: 「ドラフト」と「コンパイル済みプロンプト」

JSON は 2 種類ある。人間やエディターが扱うのは **ドラフト**。モデルに渡すのは、それを変換した **コンパイル済みプロンプト** のほう。

| | ドラフト（編集用） | コンパイル済み（モデル入力） |
| --- | --- | --- |
| 用途 | 編集・保存・再読み込み | MOSS-Image の positive prompt にそのまま入れる |
| キャンバスサイズ | `width` / `height` を持つ | **持たない**（サイズは別途、生成側で指定） |
| `bbox_coord_space` | `"abs"`（左上原点の絶対ピクセル） | `"abs_centralized"`（中心原点の絶対ピクセル） |
| `bbox_format` | `"xyxy"` = `[x_min, y_min, x_max, y_max]` | `"yxyx"` = `[y_min, x_min, y_max, x_max]` |
| bbox の数値 | 小数も可 | 整数 |
| 整形 | 読みやすいインデント付き JSON | 1 行のコンパクト JSON |

**モデルに手計算させたり、手書きで中心座標を書いたりしない。** 変換はコンパイラ（コード）で行う。

Layout を使わない場合は、プロンプトを文章（caption）だけで書く。ドラフト形式は `{"caption": "..."}` で、コンパイル結果は caption の文字列そのものになる。

---

## 2. ドラフトのスキーマ

### 2.1 ルート

| フィールド | 必須 | 型 | 内容 |
| --- | --- | --- | --- |
| `width` | ○ | int | キャンバス幅（px）。**16 の倍数の正の整数** |
| `height` | ○ | int | キャンバス高さ（px）。**16 の倍数の正の整数** |
| `bbox_coord_space` | ○ | `"abs"` | この値に固定 |
| `bbox_format` | ○ | `"xyxy"` | この値に固定 |
| `summary` | ○ | object | 画像全体の記述（2.2 節） |
| `items` | ○ | array | 要素を並べた **フラット** な配列。1 件以上 |

上記以外のフィールドは **エラーになる**。公式コンパイラは未知のフィールドを黙って捨てず、エラーとして弾く。

### 2.2 `summary`

| フィールド | 必須 | 型 | 内容 |
| --- | --- | --- | --- |
| `caption` | ○ | string（空不可） | 画像全体の説明。被写体、場面、媒体、ライティング、ムード、全体のスタイル、読む順序など |
| `meta` | | string[] | 媒体やジャンルのタグ。例: `["poster"]`、`["product campaign", "studio photography"]` |
| `canvas` | | `"single"` \| `"multi_panel"` \| `"collage"` | 画面の構成。1 枚絵 / 複数コマ / コラージュ |
| `palette` | | string[] | 全体の配色。参考実装では `#RRGGBB` 形式 |

### 2.3 `items[]`

| フィールド | 必須 | 型 | 内容 |
| --- | --- | --- | --- |
| `label` | ○ | `"object"` \| `"character"` \| `"text"` | 要素の種類。物体 / 人物 / 文字の 3 種のみ |
| `caption` | ○ | string（空不可） | 見た目の説明。text の場合は書体や色、背景面などタイポグラフィの説明 |
| `bbox` | ○ | number[4] | `[x_min, y_min, x_max, y_max]`（キャンバス左上原点の px） |
| `text` | text のとき必須 | string（空不可） | **実際に描画する文字列そのもの**。改行は JSON の `\n` で表す |
| `tags` | | string[] | 追加の意味タグ（例: `["product"]`） |
| `palette` | | string[] | 要素ごとの配色 |

#### bbox の制約

- 4 つとも有限の数値であること
- `x_min < x_max`、`y_min < y_max`（幅と高さが正）
- `0 <= x_min < x_max <= width`、`0 <= y_min < y_max <= height`（キャンバスからはみ出さない）
- はみ出した bbox は **クリップされず、エラーになる**

#### 禁止されているもの

- `children` / `parent` / `id` などの入れ子構造やエディター用 ID
- 旧形式（scene schema）の `elements`
- パーセント座標や正規化座標（0〜1）
- 説明欄に書く JSON やツール向けの注記（「この bbox は…」など）

---

## 3. コンパイル（ドラフト → モデル入力）

### 3.1 変換ルール

キャンバスを `W × H` とすると、ドラフトの `[x1, y1, x2, y2]` は次の式で変換される。

```
[ floor(y1) - H/2,  floor(x1) - W/2,  ceil(y2) - H/2,  ceil(x2) - W/2 ]
```

- 左上の辺は floor（切り捨て）、右下の辺は ceil（切り上げ）。小数の辺は外側へ広げて整数化する
- その後、中心を原点にするため W/2・H/2 を引き、`yxyx` の順に並べ替える
- 浮動小数点誤差の対策として、公式コンパイラは丸める前に `round(v, 9)` を挟んでいる
- 1024×1024 なら、座標の範囲は両軸とも -512〜+512
- 変換後に幅または高さが 0 になる場合はエラー

例: 1536×1024 のキャンバスで `[176, 224, 800, 864]` → `[-288, -592, 352, 32]`

### 3.2 出力の形

```
{"summary":{...},"items":[{...,"bbox":[y1,x1,y2,x2]}, ...],"bbox_coord_space":"abs_centralized","bbox_format":"yxyx"}
```

- キーの順序は `summary` → `items` → `bbox_coord_space` → `bbox_format`
- `items` 内の各要素は、ドラフトのキー順をそのまま保つ（bbox だけを置き換える）
- `width` / `height` は出力しない。**生成時の画像サイズはドラフトの width × height と必ず一致させる**（ずれると座標の意味が壊れる）
- `JSON.stringify` 相当のコンパクト形式で、非 ASCII 文字はエスケープしない（`ensure_ascii=False`）
- 文字列内の改行は JSON 上では `\n` とエスケープされ、デコードすると本当の改行に戻る

### 3.3 逆変換（インポート）

コンパイル済みプロンプトにはキャンバスサイズが含まれない。インポートするときは、現在のキャンバスサイズを使って次の式で逆算する。

```
x1 = bx1 + W/2,  y1 = by1 + H/2,  x2 = bx2 + W/2,  y2 = by2 + H/2
（bbox = [by1, bx1, by2, bx2]）
```

そのため、元のサイズと異なるキャンバスで読み込むと座標の解釈が変わる。サイズごと保存して完全に復元したいなら、ドラフト形式を使う。

---

## 4. キャンバスサイズ

- width と height は **16 の倍数** にする（MOSS-Image の制約）
- サイズ指定がなければ 1024×1024
- 推奨の総画素数は約 1M / 1.5M / 2M（USERGUIDE の推論パラメータ節）
- 参考実装のプリセットは、比率（1:1, 3:2, 16:9, 21:9 など）と長辺、縦横の向きから計算し、結果を 16 の倍数に丸めている
- 明示されたサイズが 16 の倍数でないとき、黙って変更しない（公式スキルの方針。ユーザーに知らせる）

---

## 5. 内容の書き方（公式スキルのガイドライン）

### 5.1 言語

- 説明文（`summary.caption`、`items[].caption`）は **英語** がデフォルト
- `text` フィールドの文字列は、**元の言語のまま一字一句保持** する。句読点、大文字小文字、改行も含めて保持する。日本語の文字を描画したい場合は、日本語のまま書く
- 「指示の中で引用されている文」と「画像に描画する文字」は区別する

### 5.2 summary.caption

- 被写体と動作、外見、場面、カメラやフレーミング、媒体、ライティング、素材、配色、ムードを書く
- 全体のスタイル（global treatment）はここに書く
- 冗長な品質タグ（masterpiece など）や、頼まれていないスタイル変更は避ける

### 5.3 items

- 「まとまって見える単位」ごとに 1 つの item にする。配置を独立させる必要があるときだけ分割する
- 段落のような文章は、`\n` を入れて 1 つの text item にまとめる。書体が混在するだけなら分割は不要
- bbox は配置の注釈。**枠やパネル、ステッカーを描け、という指示ではない**
- 自然な重なり（オクルージョン）は許容する。複数の item が同じ bbox を共有してもよい
- 文字の上に物体を置く場合なども、座標はすべてキャンバス全体のグローバル座標で表す
- `items` の並び順はプロンプト内の順序になる。読む順（上→下、左→右）に並べるのがよい（MOSSLayout スキル）
- caption の空間的な記述と、bbox の位置が矛盾しないようにする
- プレースホルダ（「見出しをここに」など）は使わず、実際のコピーを書く

### 5.4 文字のサイズ感の目安（MOSSLayout スキル）

- 1 行あたりの文字高（1em）は、bbox の高さのおよそ 0.55 倍
- ラテン文字の幅は 1 文字あたり約 0.55em、CJK（日本語など）は約 1em
- 読めないほど小さくなる場合は、文字を削らずに bbox を広げるか、構図を見直す
- 余白はキャンバスの短辺の 5〜8% 程度にするとデザインらしく見える（全面配置も可）

---

## 6. 例

### ドラフト

```json
{
  "width": 1536,
  "height": 1024,
  "bbox_coord_space": "abs",
  "bbox_format": "xyxy",
  "summary": {
    "meta": ["product campaign", "studio photography"],
    "canvas": "single",
    "caption": "A warm studio campaign for a handmade ceramic cup, with an ivory backdrop, soft side lighting and restrained dark-green typography. Keep the ceramic texture tactile and the composition calm."
  },
  "items": [
    {
      "label": "object",
      "caption": "An ivory ceramic cup with a rounded handle, fine speckled glaze and a soft contact shadow, photographed at a three-quarter angle.",
      "bbox": [176, 224, 800, 864]
    },
    {
      "label": "text",
      "caption": "Large dark-green Japanese title in crisp, moderately heavy lettering, with generous spacing and no backing panel.",
      "text": "日常を、詩に。",
      "bbox": [928, 272, 1408, 448]
    },
    {
      "label": "text",
      "caption": "Smaller dark-green Japanese supporting copy, comfortably legible on two lines.",
      "text": "あたたかな一杯\nゆとりのひととき",
      "bbox": [928, 512, 1376, 656]
    }
  ]
}
```

### コンパイル結果（実際は 1 行）

```json
{"summary":{"meta":["product campaign","studio photography"],"canvas":"single","caption":"A warm studio ..."},"items":[{"label":"object","caption":"An ivory ceramic cup ...","bbox":[-288,-592,352,32]},{"label":"text","caption":"Large dark-green Japanese title ...","text":"日常を、詩に。","bbox":[-240,160,-64,640]},{"label":"text","caption":"Smaller dark-green Japanese supporting copy ...","text":"あたたかな一杯\nゆとりのひととき","bbox":[0,160,144,608]}],"bbox_coord_space":"abs_centralized","bbox_format":"yxyx"}
```

生成時の画像サイズは **1536×1024** を指定する（プロンプトの外で指定）。

---

## 7. 参考実装から見たエディター設計のポイント

`src/app/moss` を実装するためのメモ。

### 7.1 内部状態

- 内部ではドラフト形式（px、`xyxy`）をそのまま持つ案（`Comfyui-Moss-LayoutPrompt`、`ComfyUI-MOSSLayout`）と、パーセント座標 `[左%, 上%, 幅%, 高%]` で持ち、サイズ変更時に配置を崩さない案（`ComfyUI-MOSS-Layout-UI`）がある
- どちらを選んでも、出力時は px に変換して公式コンパイラと同じ値にする
- エディター専用の情報（要素名、ロック、グループ、色など）は、コンパイル時に必ず除去する（公式スキーマは未知フィールドを拒否するため）

### 7.2 キャンバス UI

- 空き領域をドラッグして作成、要素内のドラッグで移動、右下（または四隅）のハンドルでリサイズ
- 重なっている要素を選ぶため、番号タブを付けるか、同じ位置のクリックで選択を切り替える
- 座標は数値入力でも編集できるようにする（px とパーセントの両方を表示）
- label ごとに色分けし、ラベル番号と caption の冒頭を表示する
- 「背景」は item ではない。全体の説明として `summary.caption` に入れる（MOSS-Layout-UI は背景要素の説明を summary.caption に合成している）

### 7.3 キャンバスサイズ

- 比率プリセットと長辺の組み合わせ、または幅・高さの直接入力
- 常に 16 の倍数に丸める。サイズ変更でキャンバスからはみ出す bbox がないか検証する

### 7.4 バリデーション（編集中に警告を表示）

- text item の `text` が空
- caption が空（公式コンパイラではエラー。参考実装の一部は空を許容しているが、公式に合わせるならエラー）
- bbox がキャンバス外、または幅か高さが 0
- width / height が 16 の倍数でない

### 7.5 入出力

- 出力: コンパイル済み 1 行 JSON（コピー用）と、ドラフト JSON（保存・再読み込み用）
- 入力: ドラフト、コンパイル済み（現在のキャンバスサイズで逆算）、コードフェンスや前後の文章で囲まれた JSON も寛容にパースできるとよい


---

## 8. `src/app/moss` エディターの仕様（すり合わせ結果）

### 8.1 全体の流れ

1. 開始方法は 3 つ
   - **AIで作成**: 解像度を選び、日本語で依頼を書くと AI がレイアウト（説明文は日本語）を生成する
   - **JSONを読み込む**: width / height 付きのドラフト JSON のみ受け付ける。説明文は AI で日本語に翻訳して読み込む
   - **空のキャンバス**: 解像度を選んで空の状態から手動で作る
2. エディターで日本語のまま編集する
3. 「英語に変換して出力」で説明文・タグ類だけを英訳し、コンパイル済みプロンプトとドラフト JSON を下に出力する
   - `text`（描画する文字）と配色は翻訳しない
   - 出力後に編集した場合は、もう一度ボタンを押す（自動反映はしない）
- AI モデルは OpenAI / ローカルLLM を切り替えられる
- AI への追加指示による修正やバージョン履歴は持たない

### 8.2 解像度

- 1024×1024（1:1）、1184×880（4:3）、1248×832（3:2）、1360×768（16:9）と、それぞれの縦長
- 作成後は変更不可。やり直す場合は「新規作成」（確認ダイアログあり）で全て破棄する
- 読み込む JSON の解像度が上記以外ならエラー
- サイズを持たないコンパイル済みプロンプト（`abs_centralized`）の読み込みはエラー

### 8.3 エディター

- ボックスをクリックすると選択され、右側（スマホでは下）の編集パネルで label / 見た目の説明 / 描画する文字 / bbox の数値 / タグ / 配色を編集する
- ドラッグで移動、四隅のハンドルで大きさを変更する。キャンバス外には出ない。最小サイズは 16px
- 追加はボタンのみ（物体 / 人物 / 文字）。キャンバス中央に既定サイズで置く
- 複製（右下に 32px ずらす）と削除は編集パネルのボタンから行う
- 重なりは小さいボックスほど前面に表示する。要素一覧からも選択できる
- items の並べ替え機能は持たない（MOSS の仕様に重なり順の定義はない）
- 文字ボックスには、文字高 ≒ bbox の高さ × 0.55 の目安で文字をプレビュー表示する
- Undo / Redo（Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y）。文字入力や矢印キーの連続操作は 1 手にまとめる
- 選択中のボックスは矢印キーで 1px、Shift+矢印キーで 10px 移動する。Esc で選択解除
- summary は 全体の説明 / ジャンルタグ / 画面の構成 / 全体の配色 を編集できる
- 公式コンパイラでエラーになる状態（説明が空、文字が空、はみ出しなど）は「要確認」として表示し、英訳ボタンを押しても出力しない
- localStorage への自動保存はしない

### 8.4 ファイル構成

| ファイル | 内容 |
| --- | --- |
| `page.tsx` | ページ本体。状態管理・ショートカット・英訳出力 |
| `StartPanel.tsx` | 開始画面（AI 生成 / JSON 読込 / 空のキャンバス） |
| `LayoutCanvas.tsx` | キャンバス（選択・移動・リサイズ） |
| `ItemEditor.tsx` | 要素一覧と要素の編集パネル |
| `SummaryEditor.tsx` | 画像全体の設定 |
| `PaletteInput.tsx` | 配色の入力 |
| `OutputPanel.tsx` | 出力（コンパイル済み / ドラフト） |
| `draft.ts` | ドラフトの変換・検証・コンパイル（公式 `compile_prompt.py` と同じ結果） |
| `types.ts` | 型と zod スキーマ |
| `prompt.ts` | AI 用のシステムプロンプト |
| `api.ts` | `/api/moss` の呼び出しと翻訳処理 |
| `useHistory.ts` | Undo / Redo |
| `../api/moss/route.ts` | API（`generate` / `translate`） |
