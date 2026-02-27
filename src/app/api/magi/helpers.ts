import { MODEL_PROVIDER_MAP, type ModelKey } from '@/app/magi/util';
import { google } from '@ai-sdk/google';
import { createOpenAI, openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export const resolveModel = (modelId: ModelKey): LanguageModel => {
  const config = MODEL_PROVIDER_MAP[modelId];
  if (!config) {
    throw new Error(`モデル設定 (${modelId}) が見つかりません`);
  }
  const modelName = process.env.NODE_ENV === 'production' ? config.productionModel : config.cheapModel;
  if (config.provider === 'google') {
    return google(modelName);
  }
  if (config.provider === 'openai') {
    return openai(modelName);
  }
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || 'null'
  });
  return openrouter.chat(`anthropic/${modelName}`);
};

export const ensureModelKey = (value: unknown): value is ModelKey => {
  if (typeof value !== 'string') {
    return false;
  }
  return (Object.keys(MODEL_PROVIDER_MAP) as ModelKey[]).includes(value as ModelKey);
};
