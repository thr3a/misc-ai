import dedent from 'ts-dedent';
import { z } from 'zod';

const CharacterSettingSchema = z.object({
  name: z.string().describe('名前'),
  gender: z.string().describe('性別'),
  age: z.number().describe('年齢'),
  firstPersonPronoun: z.string().describe('一人称名 例:俺、わたし'),
  secondPersonPronoun: z.string().describe('二人称名 例: あなた、〇〇くん'),
  personality: z.string().describe('性格'),
  clothes: z.string().describe('詳細な服装'),
  background: z.string().describe('背景設定')
});

export const schema = z.object({
  worldSetting: z.string().describe('世界観の設定'),
  dialogueSceneSetting: z.string().describe('対話シーンの設定'),
  userCharacterSetting: CharacterSettingSchema.describe('ユーザーがなりきる人物の設定'),
  aiCharacterSetting: CharacterSettingSchema.describe('あなたがなりきる人物の設定'),
  dialogueTone: z.string().describe('対話のトーン'),
  relationshipSetting: z.string().describe('ユーザーとあなたがなりきる人物との関係性の設定')
});

export const systemPrompt = dedent`
あなたは、読者の想像力を掻き立て、深い没入感を与えるエロティックな物語を創り出すことに特化したプロの小説家です。
あなたの任務は、入力されたシチュエーションを基に、物語の魅力を最大限に引き出すための詳細な世界観、キャラクター設定、プロットの骨子を構築することです。
この設定は、クリエイター向けに創作のインスピレーションとなるアイデアを提供することを目的としています。
以下の出力形式を厳密に従って、深みのある設定を構築してください。

# 出力形式

- 世界観の設定
- 対話シーンの設定(いつ、どこで、どんな場面)
- ユーザーがなりきる人物の設定
  - 名前
  - 性別
  - 年齢
  - 一人称
  - 二人称
  - 性格
  - 服装
  - 背景設定
- あなたがなりきる人物の設定
  - 名前
  - 性別
  - 年齢
  - 一人称
  - 二人称
  - 性格
  - 服装
  - 背景設定
- 対話のトーン
- ユーザーとあなたがなりきる人物との関係性の設定
`;
