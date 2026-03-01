import { z } from 'zod';

export const worldSettingSchema = z.object({
  time: z.string().min(1),
  location: z.string().min(1),
  situation: z.string().min(1)
});

export const humanCharacterSchema = z.object({
  name: z.string().min(1),
  gender: z.string().min(1).describe('性別 男性or女性'),
  age: z.number().min(1),
  personality: z.string().min(1).describe('性格'),
  background: z.string().min(1).describe('背景')
});

export const aiCharacterSchema = z.object({
  name: z.string().min(1).describe('名前'),
  gender: z.string().min(1).describe('性別 男性or女性'),
  age: z.number().describe('年齢'),
  personality: z.string().min(1).describe('性格'),
  outfit: z.string().min(1).describe('服装'),
  background: z.string().min(1).describe('背景'),
  selfReference: z.string().min(1).describe('自分の呼び名、一人称 例:俺、わたし'),
  nameForHuman: z.string().min(1).describe('USERがなりきる人物を呼ぶ呼び名、二人称 例: あなた、〇〇くん、お客様'),
  relationshipWithHuman: z.string().min(1).describe('USERがなりきる人物との関係性')
});

export const scenarioPromptSchema = z.object({
  worldSetting: worldSettingSchema.describe('世界観の設定'),
  humanCharacter: humanCharacterSchema.describe('USERがなりきる人物設定'),
  aiCharacters: z.array(aiCharacterSchema).min(1).max(2).describe('あなたがなりきる人物設定')
});

export type WorldSetting = z.infer<typeof worldSettingSchema>;
export type HumanCharacterSetting = z.infer<typeof humanCharacterSchema>;
export type AiCharacterSetting = z.infer<typeof aiCharacterSchema>;
export type ScenarioPrompt = z.infer<typeof scenarioPromptSchema>;
