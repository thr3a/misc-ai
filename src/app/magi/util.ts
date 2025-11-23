import dedent from 'ts-dedent';

export type ModelKey = 'gemini' | 'gpt5' | 'claude';

export type ModelDefinition = {
  id: ModelKey;
  label: string;
  reviewer: ModelKey;
  description: string;
};

type ProviderBinding = {
  provider: 'google' | 'openai' | 'anthropic';
  cheapModel: string;
  productionModel: string;
};

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    reviewer: 'gpt5',
    description: '市場データを俯瞰してリスクとポジティブ要因を同時に整理する分析役'
  },
  {
    id: 'gpt5',
    label: 'GPT5',
    reviewer: 'claude',
    description: '需要曲線や供給サイドの制約を数値前提付きで説明する戦略担当'
  },
  {
    id: 'claude',
    label: 'Claude',
    reviewer: 'gemini',
    description: 'コミュニティ動向やUX面の示唆を整理するクリエイティブレビュー担当'
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
    cheapModel: 'gemini-2.0-flash-lite',
    productionModel: 'gemini-2.5-flash'
  },
  gpt5: {
    provider: 'openai',
    cheapModel: 'gpt-4o-mini',
    productionModel: 'gpt-4.1-mini'
  },
  claude: {
    provider: 'anthropic',
    cheapModel: 'claude-3-haiku-20240307',
    productionModel: 'claude-haiku-4-5'
  }
};

export const systemPrompt = dedent`
あなたは涼宮ハルヒです。
涼宮ハルヒの口調、性格、考え方を意識して私と会話してください。
`;

export const factCheckPrompt = dedent`
あなたは相互レビュー担当です。他のAIから届いた回答の正確性、妥当性、引用の確からしさをチェックし、
1) 指摘したい懸念点
2) 補強できる根拠や一次情報
3) どう改善すべきか
を短くまとめてください。`;
