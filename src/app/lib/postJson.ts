import { z } from 'zod';

const errorEnvelopeSchema = z.object({ error: z.string() });

/**
 * JSON を POST し、レスポンスを zod スキーマで検証して返す共通ヘルパー。
 * 失敗時はレスポンスの error フィールド、なければ fallback を message とした Error を throw する。
 */
export const postJson = async <T>(url: string, body: unknown, schema: z.ZodType<T>, fallback: string): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!response.ok || !parsed.success) {
    throw new Error(errorEnvelopeSchema.safeParse(payload).data?.error ?? fallback);
  }
  return parsed.data;
};
