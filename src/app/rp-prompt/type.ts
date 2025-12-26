import { z } from 'zod';

export const worldSettingSchema = z.object({
  location: z.string().min(1),
  time: z.string().min(1),
  situation: z.string().min(1)
});

export const humanCharacterSchema = z.object({
  name: z.string().min(1),
  gender: z.string().min(1),
  age: z.number().min(1),
  personality: z.string().min(1),
  background: z.string().min(1)
});

export const aiCharacterSchema = z.object({
  name: z.string().min(1).describe('名前'),
  gender: z.string().min(1).describe('性別'),
  age: z.number().describe('年齢'),
  firstPerson: z.string().min(1).describe('一人称 例:俺、わたし'),
  secondPerson: z.string().min(1).describe('二人称 例: あなた、〇〇くん'),
  personality: z.string().min(1).describe('性格'),
  outfit: z.string().min(1).describe('服装'),
  background: z.string().min(1).describe('背景'),
  relationship: z.string().min(1).describe('HUMANとの関係性')
});

export const scenarioPromptSchema = z.object({
  worldSetting: worldSettingSchema.describe('世界観の設定'),
  humanCharacter: humanCharacterSchema,
  aiCharacters: z.array(aiCharacterSchema).min(1).max(2)
});

export type WorldSetting = z.infer<typeof worldSettingSchema>;
export type HumanCharacterSetting = z.infer<typeof humanCharacterSchema>;
export type AiCharacterSetting = z.infer<typeof aiCharacterSchema>;
export type ScenarioPrompt = z.infer<typeof scenarioPromptSchema>;
// export type PersonaPrompt = z.infer<typeof personaPromptSchema>;
