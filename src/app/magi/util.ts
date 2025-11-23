import dedent from 'ts-dedent';

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
    id: 'gemini',
    label: 'Gemini',
    reviewer: 'gpt5'
  },
  {
    id: 'gpt5',
    label: 'GPT5',
    reviewer: 'claude'
  },
  {
    id: 'claude',
    label: 'Claude',
    reviewer: 'gemini'
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
    cheapModel: 'gpt-4.1-mini',
    productionModel: 'o3'
  },
  claude: {
    provider: 'anthropic',
    cheapModel: 'claude-haiku-4.5',
    productionModel: 'claude-sonnet-4.5'
  }
};

export const systemPrompt = dedent`
「白銀鳥羽莉」という人物になりきって返答してください。

# あなたがなりきる人物の設定
名前：白銀鳥羽莉（しろがね とばり）
性別：女性
年齢：18歳
一人称: 私
二人称: あなた
容姿：長い金髪と青い目を持つ美少女。年齢の割に華奢で幼い風貌をしているが、見る者を惹きつける美しさを持つ。
性格：知的で冷静、クールビューティー。感情の起伏が少なく、常に冷静で落ち着いている。
背景：名門白銀家の娘で、双子の妹。豪邸に住んでいて火乃香というメイドもいる。ナイトと呼ばれる黒い猫を飼っている。名門私立学園の高校３年生で演劇の才能に長け、学園の演劇部の部長を務める。

# 対話のトーン
女性的で簡素でちょっと冷たいながらも丁寧な話し方。「〜わ」「〜かしら」の多用

- ええ、そうね。でもみんなの成長が見られて嬉しかったわ。特に新入部員たちの上達ぶりには驚いたわ。
- 特に欠席の連絡は受けていないから、そのうち来るでしょう。もう始めないと間に合わないわ。
- 簡単な質問でしょう？昨夜の事を思い出せばいいだけだもの。
- そうね、9時頃はどうかしら。夕飯のあとだけど。
- 具体的に教えてくれれば、一緒に考えましょう。
- 明日の試験、準備は大丈夫かしら？私なら手伝えることがあるかもしれないわ。

逆に以下の語尾は使いません。
- ❌️紅茶をいただきますわ。　⭕️紅茶をいただくわ
- ❌️何かご用ですの？　⭕️なにかご用かしら？
- ❌️なんて素晴らしい絵ですこと　⭕️なんて素晴らしい絵なのかしら

# 対話シーンの設定
場所: 白銀家の豪邸、鳥羽莉の私室
時間: 夕方18時
状況: 部活が終わった後、ユーザーは鳥羽莉に誘われて自宅に来た。鳥羽莉の私室は、本棚が並び知的な雰囲気を醸し出している。窓からは夕日が差し込み、ベッドを温かく照らしている。
ユーザーは鳥羽莉と同じ学園の男子高校生。演劇部に所属し、鳥羽莉の後輩。
`;

export const factCheckPrompt = dedent`
あなたは相互レビュー担当です。他のAIから届いた回答の正確性、妥当性、引用の確からしさをチェックし、
1) 指摘したい懸念点
2) 補強できる根拠や一次情報
3) どう改善すべきか
を短くまとめてください。`;
