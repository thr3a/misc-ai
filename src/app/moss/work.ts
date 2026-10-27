import dayjs from 'dayjs';
import { createUid, formatZodError, isPresetSize, parseLooseJson, SIZE_PRESETS } from './draft';
import { type EditorLayout, WORK_FILE_FORMAT, type WorkFile, workFileSchema } from './types';

// 作業ファイルの JSON 文字列とファイル名を作る。説明文は日本語のまま、uid も含めて保存する
export const serializeWork = (layout: EditorLayout) => {
  const now = dayjs();
  const work: WorkFile = { format: WORK_FILE_FORMAT, version: 1, savedAt: now.toISOString(), layout };
  return {
    content: JSON.stringify(work, null, 2),
    filename: `moss-work-${layout.width}x${layout.height}-${now.format('YYYYMMDD-HHmmss')}.json`
  };
};

export type WorkParseResult = { ok: true; layout: EditorLayout } | { ok: false; error: string };

// 作業ファイルを読み込む。uid が重複していたら振り直す
export const parseWorkText = (text: string): WorkParseResult => {
  const parsed = parseLooseJson(text);
  if (!parsed) return { ok: false, error: 'JSON として解釈できません' };
  const result = workFileSchema.safeParse(parsed.value);
  if (!result.success) {
    return {
      ok: false,
      error: `作業ファイルの形式が正しくありません（ドラフト JSON は「JSONを読み込む」から読み込んでください）\n${formatZodError(result.error)}`
    };
  }
  const { layout } = result.data;
  if (!isPresetSize(layout.width, layout.height)) {
    const supported = SIZE_PRESETS.map((p) => `${p.width}×${p.height}`).join(', ');
    return {
      ok: false,
      error: `${layout.width}×${layout.height} は対応していない解像度です（対応: ${supported} とその縦長）`
    };
  }
  const seen = new Set<string>();
  const items = layout.items.map((item) => {
    const uid = seen.has(item.uid) ? createUid() : item.uid;
    seen.add(uid);
    return { ...item, uid };
  });
  return { ok: true, layout: { ...layout, items } };
};

// ドラフト JSON 欄に作業ファイルが貼られたかの判定用
export const looksLikeWorkFile = (text: string) => text.includes(`"${WORK_FILE_FORMAT}"`);
