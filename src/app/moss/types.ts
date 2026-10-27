import { z } from 'zod';

export type ModelId = 'openai' | 'local';

export const ITEM_LABELS = ['object', 'character', 'text'] as const;
export type ItemLabel = (typeof ITEM_LABELS)[number];

export const CANVAS_MODES = ['single', 'multi_panel', 'collage'] as const;
export type CanvasMode = (typeof CANVAS_MODES)[number];

// キャンバス左上原点の絶対ピクセル座標
export type Bbox = { x1: number; y1: number; x2: number; y2: number };

// エディター内部で保持する要素。uid はエディター専用でコンパイル時に除去する
export type EditorItem = {
  uid: string;
  label: ItemLabel;
  caption: string;
  text: string;
  bbox: Bbox;
  tags: string[];
  palette: string[];
};

export type EditorSummary = {
  caption: string;
  meta: string[];
  canvas: CanvasMode | null;
  palette: string[];
};

export type EditorLayout = {
  width: number;
  height: number;
  summary: EditorSummary;
  items: EditorItem[];
};

// 英訳・コンパイル後の出力
export type LayoutOutput = {
  prompt: string;
  draftJson: string;
  width: number;
  height: number;
};

const nonEmpty = z.string().refine((s) => s.trim() !== '', { message: '空文字は使えません' });

// 公式コンパイラ（compile_prompt.py）と同じく未知フィールドを拒否するドラフトのスキーマ
export const draftItemSchema = z
  .strictObject({
    label: z.enum(ITEM_LABELS),
    caption: nonEmpty,
    text: nonEmpty.optional(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    tags: z.array(nonEmpty).optional(),
    palette: z.array(nonEmpty).optional()
  })
  .refine((item) => item.label !== 'text' || item.text !== undefined, {
    message: 'text 要素には text が必要です',
    path: ['text']
  });

export const draftSchema = z.strictObject({
  width: z.number().int().positive().multipleOf(16),
  height: z.number().int().positive().multipleOf(16),
  bbox_coord_space: z.literal('abs'),
  bbox_format: z.literal('xyxy'),
  summary: z.strictObject({
    meta: z.array(nonEmpty).optional(),
    canvas: z.enum(CANVAS_MODES).optional(),
    caption: nonEmpty,
    palette: z.array(nonEmpty).optional()
  }),
  items: z.array(draftItemSchema).min(1)
});

export type Draft = z.infer<typeof draftSchema>;
export type DraftItem = z.infer<typeof draftItemSchema>;

// AI にレイアウトを生成させるときの構造化出力スキーマ。Structured Outputs の制約上、全フィールドを必須にしている
export const generatedLayoutSchema = z.object({
  summary: z.object({
    caption: z.string().describe('画像全体の説明（日本語）'),
    meta: z.array(z.string()).describe('媒体やジャンルのタグ（日本語）'),
    canvas: z.enum(CANVAS_MODES).describe('single: 1枚絵, multi_panel: 複数コマ, collage: コラージュ'),
    palette: z.array(z.string()).describe('全体の主要な配色 (#RRGGBB)')
  }),
  items: z.array(
    z.object({
      label: z.enum(ITEM_LABELS),
      caption: z.string().describe('要素の見た目の説明（日本語）'),
      text: z.string().describe('label が text のとき画像に描画する文字列そのもの。それ以外は空文字'),
      bbox: z
        .object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() })
        .describe('キャンバス左上原点の絶対ピクセル座標'),
      tags: z.array(z.string()).describe('補助的な意味タグ（日本語）。不要なら空配列'),
      palette: z.array(z.string()).describe('要素固有の配色 (#RRGGBB)。不要なら空配列')
    })
  )
});

export type GeneratedLayout = z.infer<typeof generatedLayoutSchema>;

export const translationSchema = z.object({
  translations: z.array(z.string())
});
