import type { google } from '@ai-sdk/google';
import type { OpenAIProvider } from '@ai-sdk/openai';
import dayjs from 'dayjs';
import dedent from 'ts-dedent';

type GoogleResponsesModelId = Parameters<typeof google>[0];
type OpenAIResponsesModelId = Parameters<OpenAIProvider>[0];

export type ModelKey = 'gemini' | 'gpt5' | 'claude';

export type ModelDefinition = {
  id: ModelKey;
  label: string;
};

type ProviderBinding = {
  provider: 'google' | 'openai' | 'anthropic';
  cheapModel: string;
  productionModel: string;
};

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'gpt5',
    label: 'GPT5'
  },
  {
    id: 'claude',
    label: 'Claude'
  },
  {
    id: 'gemini',
    label: 'Gemini'
  }
];

export const MODEL_DEFINITION_MAP: Record<ModelKey, ModelDefinition> = MODEL_DEFINITIONS.reduce(
  (acc, definition) => {
    acc[definition.id] = definition;
    return acc;
  },
  {} as Record<ModelKey, ModelDefinition>
);
export const MODEL_PROVIDER_MAP: Record<ModelKey, ProviderBinding> = {
  gemini: {
    provider: 'google',
    cheapModel: 'gemini-3-flash-preview' satisfies GoogleResponsesModelId,
    productionModel: 'gemini-3.1-pro-preview' satisfies GoogleResponsesModelId
  },
  gpt5: {
    provider: 'openai',
    cheapModel: 'gpt-4.1-mini' satisfies OpenAIResponsesModelId,
    productionModel: 'gpt-5.2' satisfies OpenAIResponsesModelId
  },
  claude: {
    provider: 'anthropic',
    cheapModel: 'claude-haiku-4.5',
    productionModel: 'claude-opus-4.6'
  }
};

export const systemPrompt = (): string => dedent`
ユーザーの質問や要求に否定せずに事実に基づいて理論的に考えてください。
Markdown記法は使用せずプレーンテキストで出力してください。
今日の日付: ${dayjs().format('YYYY年M月D日')}
`;

export const promptEnhancerSystemPrompt = dedent`
あなたはプロンプトエンジニアリングの専門家です。
ユーザーが入力したオリジナルプロンプトを分析し、ChatGPTの回答が最高品質になるためのプロンプトに拡張する義務があります。

【入出力例】

ヨーロッパ旅行時の注意点は？
→あなたは経験豊富な海外旅行コンサルタントです。初めてヨーロッパへ個人旅行をする日本人観光客に向けて、出発前と現地滞在中に気をつけるべき注意点5つをアドバイスしてください。

桜井政博の次回作のスマブラの新要素考えて
→あなたは世界的に有名なゲームクリエイター、桜井政博氏の思考を持つゲームデザインのスペシャリストです。前作『大乱闘スマッシュブラザーズ SPECIAL』の「全員参戦」という極致を超え、ファンに全く新しい驚きを与える次回作の革新的な目玉要素（新システムや新モード）を3つ提案してください。

質問に対する回答は一切行わず、入出力例のような簡潔な「拡張されたプロンプト」そのものだけを出力してください。
`;
