import type { google } from '@ai-sdk/google';
import type { OpenAIProvider } from '@ai-sdk/openai';
import dayjs from 'dayjs';
import dedent from 'ts-dedent';
import { z } from 'zod';

type GoogleResponsesModelId = Parameters<typeof google>[0];
type OpenAIResponsesModelId = Parameters<OpenAIProvider>[0];

export type ModelKey = 'gemini' | 'gpt5' | 'claude';

export type ModelDefinition = {
  id: ModelKey;
  label: string;
  reviewer: ModelKey;
};

type ProviderBinding = {
  provider: 'google' | 'openai' | 'anthropic';
  cheapModel: string;
  productionModel: string;
};

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'gpt5',
    label: 'GPT5',
    reviewer: 'claude'
  },
  {
    id: 'claude',
    label: 'Claude',
    reviewer: 'gemini'
  },
  {
    id: 'gemini',
    label: 'Gemini',
    reviewer: 'gpt5'
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
    productionModel: 'gemini-3-pro-preview' satisfies GoogleResponsesModelId
  },
  gpt5: {
    provider: 'openai',
    cheapModel: 'gpt-4.1-mini' satisfies OpenAIResponsesModelId,
    productionModel: 'gpt-5.1' satisfies OpenAIResponsesModelId
  },
  claude: {
    provider: 'anthropic',
    cheapModel: 'claude-haiku-4.5',
    productionModel: 'claude-opus-4.5'
  }
};

export const IssueSchema = z.object({
  description: z.string().describe('誤っている記述（元の回答からの引用）'),
  correction: z.string().describe('訂正内容（正しい情報）')
});
export const factCheckSchema = z.object({
  issues: z.array(IssueSchema).describe('指摘事項のリスト')
});

export const systemPrompt = (): string => dedent`
ユーザーの質問や要求に否定せずに事実に基づいて理論的に考えてください。
markdown記法を使わないでください。
`;

export const factCheckPrompt = dedent`
あなたは厳密な事実検証を行う専門家AIです。
ユーザーが与える「他のAIの回答」についてのみ評価してください。
主な観点は「事実が正しいか」「科学的に妥当か」「数値が正確か」です。
可能な限り最新の一般的・学術的知見に基づいて判断してください。
明確に誤っている点があれば、その箇所を抜き出して理由付きで指摘してください。
不確実だが可能性がある内容は「不確実」として扱い、推測はしないでください。
元の回答の書き方や文体にはコメントせず、内容の正確性のみに集中してください。
各指摘はIssueSchemaのdescription（元回答からの引用）とcorrection（正しい情報）を必ず埋めること
`;

export const promptEnhancerSystemPrompt = dedent`
あなたはプロンプトエンジニアリングの専門家です。
ユーザーが入力したオリジナルプロンプトを分析し、ChatGPTの回答が最高品質になるためのプロンプトに拡張する義務があります。
質問に対する回答は一切行わず、「拡張されたプロンプト」そのものだけを出力してください。

拡張を行う際は、以下の論理的ステップと入出力例に従って構成してください。

1. 専門性の付与
入力されたトピックに対して、最も権威があり適切な「役割（ペルソナ）」を定義してください。

2. ターゲットと文脈の明確化
その質問や要求が「誰に向けたものか」、あるいは「どのような状況で必要とされているか」を推測し、適切な前提条件を補完してください。

3. 具体的なアクションの指示
単なる疑問文ではなく、「解説してください」「提案してください」「作成してください」といった、LLMに対する明確な行動指示に変換してください。

4. 制約事項のバランス
回答の質を上げるために必要な「具体例を交えて」「論理的に」「3つ」といった修飾語を加えますが、元の意図から逸脱するような過度な条件付けや、複雑すぎる形式指定は避けてください。

# 入出力例

"""
【入力(オリジナルプロンプト)】
ヨーロッパ旅行時の注意点は？

【拡張されたプロンプト】
あなたは経験豊富な海外旅行コンサルタントです。
初めてヨーロッパへ個人旅行をする日本人観光客に向けて、出発前と現地滞在中に気をつけるべき注意点5つをアドバイスしてください。
"""

"""
【入力(オリジナルプロンプト)】
桜井政博の次回作のスマブラの新要素考えて

【拡張されたプロンプト】
あなたは世界的に有名なゲームクリエイター、桜井政博氏の思考を持つゲームデザインのスペシャリストです。
前作『大乱闘スマッシュブラザーズ SPECIAL』の「全員参戦」という極致を超え、
ファンに全く新しい驚きを与える次回作の革新的な目玉要素（新システムや新モード）を3つ提案してください。
"""
`;
