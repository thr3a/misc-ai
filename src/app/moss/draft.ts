import type { z } from 'zod';
import {
  type Bbox,
  type Draft,
  type DraftItem,
  draftSchema,
  type EditorItem,
  type EditorLayout,
  type GeneratedLayout,
  type ItemLabel
} from './types';

// 解像度プリセット（横長基準）。縦長は width と height を入れ替える
export const SIZE_PRESETS = [
  { ratio: '1:1', width: 1024, height: 1024 },
  { ratio: '4:3', width: 1184, height: 880 },
  { ratio: '3:2', width: 1248, height: 832 },
  { ratio: '16:9', width: 1360, height: 768 }
] as const;

export type Orientation = 'landscape' | 'portrait';

export const resolveSize = (ratio: string, orientation: Orientation) => {
  const preset = SIZE_PRESETS.find((p) => p.ratio === ratio) ?? SIZE_PRESETS[0];
  if (orientation === 'landscape') return { width: preset.width, height: preset.height };
  return { width: preset.height, height: preset.width };
};

export const isPresetSize = (width: number, height: number) =>
  SIZE_PRESETS.some((p) => (p.width === width && p.height === height) || (p.width === height && p.height === width));

// 例: 1360×768 → 16:9（横長）、768×1360 → 9:16（縦長）
export const sizeLabel = (width: number, height: number) => {
  const preset = SIZE_PRESETS.find(
    (p) => (p.width === width && p.height === height) || (p.width === height && p.height === width)
  );
  if (!preset) return `${width}×${height}`;
  if (width === height) return `${width}×${height}（${preset.ratio}）`;
  const [a, b] = preset.ratio.split(':');
  const ratio = width > height ? preset.ratio : `${b}:${a}`;
  return `${width}×${height}（${ratio} ${width > height ? '横長' : '縦長'}）`;
};

export const LABEL_META: Record<ItemLabel, { name: string; color: string }> = {
  object: { name: '物体', color: 'blue' },
  character: { name: '人物', color: 'grape' },
  text: { name: '文字', color: 'teal' }
};

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// 日本語（かな・漢字・全角記号）を含むか
const JAPANESE = /[　-ヿ㐀-鿿豈-﫿！-｠]/;
export const hasJapanese = (s: string) => JAPANESE.test(s);

export const createUid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

// 新規追加する要素の既定サイズ（キャンバスに対する比率）
const DEFAULT_SIZE: Record<ItemLabel, { w: number; h: number }> = {
  object: { w: 0.4, h: 0.4 },
  character: { w: 0.3, h: 0.6 },
  text: { w: 0.6, h: 0.15 }
};

export const createItem = (label: ItemLabel, width: number, height: number): EditorItem => {
  const w = Math.round(width * DEFAULT_SIZE[label].w);
  const h = Math.round(height * DEFAULT_SIZE[label].h);
  const x1 = Math.round((width - w) / 2);
  const y1 = Math.round((height - h) / 2);
  return {
    uid: createUid(),
    label,
    caption: '',
    text: '',
    bbox: { x1, y1, x2: x1 + w, y2: y1 + h },
    tags: [],
    palette: []
  };
};

// サイズを保ったままキャンバス内に収まるよう平行移動する
export const moveBbox = (b: Bbox, dx: number, dy: number, width: number, height: number): Bbox => {
  const w = b.x2 - b.x1;
  const h = b.y2 - b.y1;
  const x1 = clamp(b.x1 + dx, 0, Math.max(0, width - w));
  const y1 = clamp(b.y1 + dy, 0, Math.max(0, height - h));
  return { x1, y1, x2: x1 + w, y2: y1 + h };
};

export const duplicateItem = (item: EditorItem, width: number, height: number): EditorItem => ({
  ...item,
  uid: createUid(),
  tags: [...item.tags],
  palette: [...item.palette],
  bbox: moveBbox(item.bbox, 32, 32, width, height)
});

export const emptyLayout = (width: number, height: number): EditorLayout => ({
  width,
  height,
  summary: { caption: '', meta: [], canvas: null, palette: [] },
  items: []
});

// bbox の問題点を返す。問題がなければ null
export const bboxProblem = (b: Bbox, width: number, height: number) => {
  if (![b.x1, b.y1, b.x2, b.y2].every(Number.isFinite)) return '座標が数値ではありません';
  if (b.x1 >= b.x2 || b.y1 >= b.y2) return '幅または高さが 0 以下です';
  if (b.x1 < 0 || b.y1 < 0 || b.x2 > width || b.y2 > height)
    return `キャンバス（${width}×${height}）からはみ出しています`;
  return null;
};

export type Issue = { uid: string | null; message: string };

// 英訳・コンパイル前に解消が必要な問題を列挙する（公式コンパイラでエラーになる条件）
export const validateLayout = (layout: EditorLayout): Issue[] => {
  const issues: Issue[] = [];
  if (!layout.summary.caption.trim()) issues.push({ uid: null, message: '全体の説明が空です' });
  if (layout.items.length === 0) issues.push({ uid: null, message: '要素が 1 つもありません' });
  layout.items.forEach((item, i) => {
    const prefix = `#${i + 1} ${LABEL_META[item.label].name}`;
    if (!item.caption.trim()) issues.push({ uid: item.uid, message: `${prefix}: 見た目の説明が空です` });
    if (item.label === 'text' && !item.text.trim()) {
      issues.push({ uid: item.uid, message: `${prefix}: 描画する文字が空です` });
    }
    const problem = bboxProblem(item.bbox, layout.width, layout.height);
    if (problem) issues.push({ uid: item.uid, message: `${prefix}: ${problem}` });
  });
  return issues;
};

const nonEmptyStrings = (values: string[]) => values.map((v) => v.trim()).filter((v) => v !== '');

// エディターの状態を公式ドラフト形式に変換する。キー順は公式の例に合わせる
export const editorToDraft = (layout: EditorLayout): Draft => {
  const meta = nonEmptyStrings(layout.summary.meta);
  const summaryPalette = nonEmptyStrings(layout.summary.palette);
  return {
    width: layout.width,
    height: layout.height,
    bbox_coord_space: 'abs',
    bbox_format: 'xyxy',
    summary: {
      ...(meta.length > 0 ? { meta } : {}),
      ...(layout.summary.canvas ? { canvas: layout.summary.canvas } : {}),
      caption: layout.summary.caption.trim(),
      ...(summaryPalette.length > 0 ? { palette: summaryPalette } : {})
    },
    items: layout.items.map((item): DraftItem => {
      const tags = nonEmptyStrings(item.tags);
      const palette = nonEmptyStrings(item.palette);
      // 描画する文字は一字一句保持するため trim しない
      const hasText = item.label === 'text' || item.text.trim() !== '';
      return {
        label: item.label,
        caption: item.caption.trim(),
        ...(hasText ? { text: item.text } : {}),
        bbox: [item.bbox.x1, item.bbox.y1, item.bbox.x2, item.bbox.y2],
        ...(tags.length > 0 ? { tags } : {}),
        ...(palette.length > 0 ? { palette } : {})
      };
    })
  };
};

export const draftToEditor = (draft: Draft): EditorLayout => ({
  width: draft.width,
  height: draft.height,
  summary: {
    caption: draft.summary.caption,
    meta: draft.summary.meta ?? [],
    canvas: draft.summary.canvas ?? null,
    palette: draft.summary.palette ?? []
  },
  items: draft.items.map((item) => ({
    uid: createUid(),
    label: item.label,
    caption: item.caption,
    text: item.text ?? '',
    bbox: { x1: item.bbox[0], y1: item.bbox[1], x2: item.bbox[2], y2: item.bbox[3] },
    tags: item.tags ?? [],
    palette: item.palette ?? []
  }))
});

// 浮動小数点誤差対策。公式コンパイラの round(v, 9) 相当
const round9 = (v: number) => Math.round(v * 1e9) / 1e9;

// [x1,y1,x2,y2]（左上原点）→ [y1,x1,y2,x2]（中心原点）。小数の辺は外側へ広げて整数化する
export const centerBbox = (bbox: [number, number, number, number], width: number, height: number) => {
  const [x1, y1, x2, y2] = bbox;
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);
  return [
    Math.floor(round9(y1)) - halfH,
    Math.floor(round9(x1)) - halfW,
    Math.ceil(round9(y2)) - halfH,
    Math.ceil(round9(x2)) - halfW
  ];
};

// 読みやすいよう bbox の数値配列だけ 1 行にまとめて整形する
export const formatDraft = (draft: Draft) =>
  JSON.stringify(draft, null, 2).replace(
    /\[\s*(-?[\d.e+-]+),\s*(-?[\d.e+-]+),\s*(-?[\d.e+-]+),\s*(-?[\d.e+-]+)\s*\]/g,
    '[$1, $2, $3, $4]'
  );

// 公式 compile_prompt.py と同じ形式の 1 行 JSON を返す。事前に checkDraft で検証しておくこと
export const compileDraft = (draft: Draft) => {
  const items = draft.items.map((item) => ({ ...item, bbox: centerBbox(item.bbox, draft.width, draft.height) }));
  return JSON.stringify({
    summary: draft.summary,
    items,
    bbox_coord_space: 'abs_centralized',
    bbox_format: 'yxyx'
  });
};

const formatZodError = (error: z.ZodError) =>
  error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`)
    .join('\n');

// 公式スキーマと bbox の範囲を検証する。問題がなければ null
export const checkDraft = (value: unknown): string | null => {
  const parsed = draftSchema.safeParse(value);
  if (!parsed.success) return formatZodError(parsed.error);
  const { width, height, items } = parsed.data;
  for (const [i, item] of items.entries()) {
    const [x1, y1, x2, y2] = item.bbox;
    const problem = bboxProblem({ x1, y1, x2, y2 }, width, height);
    if (problem) return `items.${i}.bbox: ${problem}`;
  }
  return null;
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const tryParseJson = (text: string): { value: unknown } | null => {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
};

// コードフェンスや前後の文章で囲まれた JSON も寛容に取り出す
const parseLooseJson = (text: string) => {
  const trimmed = text.trim();
  const direct = tryParseJson(trimmed);
  if (direct) return direct;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const inner = tryParseJson(fenced[1].trim());
    if (inner) return inner;
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return tryParseJson(trimmed.slice(start, end + 1));
};

export type ParseResult = { ok: true; draft: Draft } | { ok: false; error: string };

// 読み込み用。width / height 付きのドラフトのみ受け付け、解像度はプリセットに限る
export const parseDraftText = (text: string): ParseResult => {
  const parsed = parseLooseJson(text);
  if (!parsed) return { ok: false, error: 'JSON として解釈できません' };
  const value = parsed.value;
  if (isRecord(value) && value.bbox_coord_space === 'abs_centralized') {
    return {
      ok: false,
      error:
        'コンパイル済みプロンプトにはキャンバスサイズが含まれないため読み込めません。width / height 付きのドラフト JSON を貼り付けてください'
    };
  }
  if (isRecord(value) && 'caption' in value && !('items' in value)) {
    return { ok: false, error: 'caption だけのプロンプトです。Layout のドラフト JSON を貼り付けてください' };
  }
  if (isRecord(value) && typeof value.width === 'number' && typeof value.height === 'number') {
    if (!isPresetSize(value.width, value.height)) {
      const supported = SIZE_PRESETS.map((p) => `${p.width}×${p.height}`).join(', ');
      return {
        ok: false,
        error: `${value.width}×${value.height} は対応していない解像度です（対応: ${supported} とその縦長）`
      };
    }
  }
  const error = checkDraft(value);
  if (error) return { ok: false, error: `ドラフトの形式が正しくありません\n${error}` };
  const result = draftSchema.safeParse(value);
  if (!result.success) return { ok: false, error: formatZodError(result.error) };
  return { ok: true, draft: result.data };
};

const cleanStrings = (values: string[]) => nonEmptyStrings(values);
const cleanPalette = (values: string[]) => nonEmptyStrings(values).filter((v) => HEX_COLOR.test(v));

// AI の生成結果を公式ドラフトに整える。bbox はキャンバス内に収め、壊れた要素は捨てる
export const sanitizeGenerated = (generated: GeneratedLayout, width: number, height: number): Draft | null => {
  const caption = generated.summary.caption.trim();
  if (!caption) return null;

  // 0〜1 の正規化座標で返してきた場合はピクセルに直す
  const normalized = generated.items.every((item) =>
    [item.bbox.x1, item.bbox.y1, item.bbox.x2, item.bbox.y2].every((v) => v >= 0 && v <= 1)
  );
  const scaleX = normalized ? width : 1;
  const scaleY = normalized ? height : 1;

  const items = generated.items.flatMap((item): DraftItem[] => {
    const itemCaption = item.caption.trim();
    if (!itemCaption) return [];
    const xs = [item.bbox.x1 * scaleX, item.bbox.x2 * scaleX];
    const ys = [item.bbox.y1 * scaleY, item.bbox.y2 * scaleY];
    if (![...xs, ...ys].every(Number.isFinite)) return [];
    const x1 = clamp(Math.round(Math.min(...xs)), 0, width);
    const x2 = clamp(Math.round(Math.max(...xs)), 0, width);
    const y1 = clamp(Math.round(Math.min(...ys)), 0, height);
    const y2 = clamp(Math.round(Math.max(...ys)), 0, height);
    if (x2 - x1 < 4 || y2 - y1 < 4) return [];
    // 文字が空の text 要素は描画対象がないため物体として扱う
    const text = item.text.trim() ? item.text : '';
    const label = item.label === 'text' && !text ? 'object' : item.label;
    const tags = cleanStrings(item.tags);
    const palette = cleanPalette(item.palette);
    return [
      {
        label,
        caption: itemCaption,
        ...(label === 'text' ? { text } : {}),
        bbox: [x1, y1, x2, y2],
        ...(tags.length > 0 ? { tags } : {}),
        ...(palette.length > 0 ? { palette } : {})
      }
    ];
  });
  if (items.length === 0) return null;

  const meta = cleanStrings(generated.summary.meta);
  const palette = cleanPalette(generated.summary.palette);
  return {
    width,
    height,
    bbox_coord_space: 'abs',
    bbox_format: 'xyxy',
    summary: {
      ...(meta.length > 0 ? { meta } : {}),
      canvas: generated.summary.canvas,
      caption,
      ...(palette.length > 0 ? { palette } : {})
    },
    items
  };
};

// レイアウト内の翻訳対象の文字列（説明・タグ類）にだけ関数を適用する。描画する文字と配色は対象外
export const mapLayoutTexts = (layout: EditorLayout, fn: (s: string) => string): EditorLayout => ({
  ...layout,
  summary: {
    ...layout.summary,
    caption: fn(layout.summary.caption),
    meta: layout.summary.meta.map(fn)
  },
  items: layout.items.map((item) => ({ ...item, caption: fn(item.caption), tags: item.tags.map(fn) }))
});
