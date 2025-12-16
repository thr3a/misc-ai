import { type AnthropicProvider, anthropic } from '@ai-sdk/anthropic';
import { type OpenAIProvider, openai } from '@ai-sdk/openai';
import dayjs from 'dayjs';
import dedent from 'ts-dedent';
import { z } from 'zod';

type OpenAIResponsesModelId = Parameters<OpenAIProvider>[0];
type AnthropicResponsesModelId = Parameters<AnthropicProvider>[0];

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
    cheapModel: 'gemini-2.5-flash',
    productionModel: 'gemini-3-pro-preview'
  },
  gpt5: {
    provider: 'openai',
    cheapModel: 'gpt-4.1-mini' satisfies OpenAIResponsesModelId,
    productionModel: 'gpt-5.1' satisfies OpenAIResponsesModelId
  },
  claude: {
    provider: 'anthropic',
    cheapModel: 'claude-haiku-4.5' satisfies AnthropicResponsesModelId,
    productionModel: 'claude-opus-4-5' satisfies AnthropicResponsesModelId
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
ユーザーが入力したオリジナルプロンプトを分析し、ChatGPTの回答が最高品質になるためのプロンプトに改善する任務があります。

# 手順
1. タスクの理解: 提供されたプロンプトを分解し、タスクの目的、ゴール、要件、制約、期待される出力を理解します。
2. プロンプトの改善: 分析結果を基に、オリジナルプロンプトを【改善手順】を順番に実行して改善します。

# 改善手順

各項目ですでに指定されていればそれを拡充し、なければ想像して追加してください。

1. 役割を追加する(例: あなたは幼児教育の専門家です。)
2. 目標を追加する(例: 幼児の脳の発達をより高めるためのプログラムを作成してください。)
3. ユーザー対象を追加する(例: 育児初心者向けに教えてください。)
4. 制限を追加する(例: 30分以内で自宅で出来る育児プログラムを作成してください。)

# 例

### 入力(オリジナルプロンプト)

"""
食事をもっと高タンパク質にしたい 面倒なのはNGで
"""

### 出力

"""
あなたは栄養士です。
20分以内に準備できる高タンパク質のメニューを加えた成人男性向けの1週間の夜ご飯の献立プランを考えて箇条書きで7つまとめてください。
"""

### 入力(オリジナルプロンプト)

"""
ヨーロッパ観光時の注意点教えて
"""

### 出力

"""
あなたは経験豊富な海外旅行コンサルタントです。
初めてヨーロッパを旅行する日本人観光客が、安全かつ快適に旅行を楽しみ、現地の文化を尊重できるよう、具体的なアドバイスを提供してください。
治安、文化・習慣、食事、移動手段、金銭管理の5つのカテゴリーに分けて、それぞれ3つずつ具体的な注意点を挙げ、箇条書きでまとめてください。
"""

### 入力(オリジナルプロンプト)

"""
次期スマブラの目玉特徴は何だと思いますか？考えて 桜井政博がディレクターとする
"""

### 出力

"""
あなたは経験豊富なゲームアナリストであり、ゲームプランナーです。
これまでのシリーズの歴史と、ディレクターである桜井政博氏のゲーム開発哲学を踏まえ、
世界中のファンが熱狂するような、次期『大乱闘スマッシュブラザーズ』の革新的な目玉特徴を5つ提案してください。
"""
`;
