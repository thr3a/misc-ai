import { z } from 'zod';

export const narratorSchema = z.object({
  gender: z.string().describe('性別 例:男性、女性'),
  ageGroup: z.string().describe('年代 例: 30代、学生など'),
  description: z.string().describe('歌詞から読み取れる語り手の詳細説明')
});

export const characterSchema = z.object({
  gender: z.string().describe('性別 例:男性、女性'),
  ageGroup: z.string().describe('年代 例: 30代、学生など'),
  relationshipWithNarrator: z.string().describe('語り手との関係性')
});

export const lyricAnalysisSchema = z.object({
  narrator: narratorSchema.describe('歌詞の主体となる人物、語り手'),
  characters: z.array(characterSchema).describe('その他の登場人物'),
  summary: z.string().describe('歌詞の概要')
});

export type LyricAnalysis = z.infer<typeof lyricAnalysisSchema>;
