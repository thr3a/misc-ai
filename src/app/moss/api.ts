import { z } from 'zod';
import { draftItemToEditor, draftToEditor, hasJapanese, mapLayoutTexts } from './draft';
import {
  draftItemSchema,
  draftSchema,
  type EditorItem,
  type EditorLayout,
  type ModelId,
  translationSchema
} from './types';

const postApi = async (body: Record<string, unknown>) => {
  const res = await fetch('/api/moss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  return json;
};

const generateResponseSchema = z.object({ draft: draftSchema });

// 日本語の依頼からレイアウト（説明文は日本語）を生成する。失敗時は null
export const generateLayout = async (
  model: ModelId,
  prompt: string,
  width: number,
  height: number
): Promise<EditorLayout | null> => {
  const json = await postApi({ mode: 'generate', model, prompt, width, height });
  const parsed = generateResponseSchema.safeParse(json);
  if (!parsed.success) return null;
  return draftToEditor(parsed.data.draft);
};

// 指示に従ってレイアウト全体（summary と全要素）を書き換える。失敗時は null
export const reviseLayout = async (
  model: ModelId,
  layout: EditorLayout,
  instruction: string
): Promise<EditorLayout | null> => {
  const json = await postApi({ mode: 'revise', model, layout, instruction });
  const parsed = generateResponseSchema.safeParse(json);
  if (!parsed.success) return null;
  return draftToEditor(parsed.data.draft);
};

const reviseItemResponseSchema = z.object({ items: z.array(draftItemSchema) });

// 指示に従って 1 要素だけを書き換え、置き換える要素の配列を返す（空なら削除）。失敗時は null
export const reviseItem = async (
  model: ModelId,
  layout: EditorLayout,
  uid: string,
  instruction: string
): Promise<EditorItem[] | null> => {
  const json = await postApi({ mode: 'reviseItem', model, layout, uid, instruction });
  const parsed = reviseItemResponseSchema.safeParse(json);
  if (!parsed.success) return null;
  return parsed.data.items.map(draftItemToEditor);
};

// 英訳時は日本語を含む文字列だけ、和訳時は英字が主体の文字列だけを翻訳対象にする
const needsTranslation = (s: string, target: 'en' | 'ja') => {
  if (!s.trim()) return false;
  if (target === 'en') return hasJapanese(s);
  // 英文中に固有名詞や描画する文字として日本語が残ることがあるため、英字の多さで判定する
  const latin = s.match(/[A-Za-z]/g)?.length ?? 0;
  const japanese = s.match(/[\u3040-\u30ff\u3400-\u9fff]/g)?.length ?? 0;
  return latin >= 4 && latin > japanese;
};

// 説明文・タグ類をまとめて翻訳する。描画する文字（text）と配色は翻訳しない。失敗時は null
export const translateLayout = async (
  layout: EditorLayout,
  target: 'en' | 'ja',
  model: ModelId
): Promise<EditorLayout | null> => {
  const collected = new Set<string>();
  mapLayoutTexts(layout, (s) => {
    if (needsTranslation(s, target)) collected.add(s);
    return s;
  });
  const texts = [...collected];
  if (texts.length === 0) return layout;

  const json = await postApi({ mode: 'translate', model, target, texts });
  const parsed = translationSchema.safeParse(json);
  if (!parsed.success || parsed.data.translations.length !== texts.length) return null;

  const dictionary = new Map(texts.map((t, i) => [t, parsed.data.translations[i] || t]));
  return mapLayoutTexts(layout, (s) => dictionary.get(s) ?? s);
};

export const downloadText = (content: string, filename: string) => {
  const blob = new Blob([`${content}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
