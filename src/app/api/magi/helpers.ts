import { MODEL_PROVIDER_MAP, type ModelKey } from '@/app/magi/util';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';

export const jsonResponse = (payload: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

export const resolveModel = (modelId: ModelKey): LanguageModel => {
  const config = MODEL_PROVIDER_MAP[modelId];
  if (!config) {
    throw new Error(`モデル設定 (${modelId}) が見つかりません`);
  }
  if (config.provider === 'google') {
    return google(config.productionModel);
  }
  if (config.provider === 'openai') {
    return openai(config.productionModel);
  }
  const key = process.env.OPENROUTER_API_KEY || 'null';
  return createOpenRouter({ apiKey: key }).chat(`anthropic/${config.productionModel}`);
};

export const ensureModelKey = (value: unknown): value is ModelKey => {
  if (typeof value !== 'string') {
    return false;
  }
  return (['gemini', 'gpt5', 'claude'] as const).includes(value as ModelKey);
};
