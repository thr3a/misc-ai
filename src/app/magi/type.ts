import { z } from 'zod';

export const synthesizeResultSchema = z.object({
  commonOpinions: z.array(z.string()).describe('共通している意見 2名以上の回答者が共通して支持している主張のリスト'),
  uniqueOpinions: z.array(z.string()).describe('ユニークな意見 1名のみが述べている独自の主張のリスト'),
  conflictingOpinions: z.array(z.string()).describe('対立している意見 回答者間で意見が分かれている主張のリスト')
});

export type SynthesizeResult = z.infer<typeof synthesizeResultSchema>;

export const reconSourceSchema = z.object({
  url: z.string(),
  title: z.string()
});

export const reconResultSchema = z.object({
  summary: z.string(),
  sources: z.array(reconSourceSchema).default([])
});

export type ReconSource = z.infer<typeof reconSourceSchema>;

export type ReconResult = z.infer<typeof reconResultSchema>;

export const OPINION_SECTIONS = [
  { key: 'commonOpinions', label: '共通している意見', color: 'teal' },
  { key: 'uniqueOpinions', label: 'ユニークな意見', color: 'violet' },
  { key: 'conflictingOpinions', label: '対立している意見', color: 'orange' }
] as const satisfies ReadonlyArray<{ key: keyof SynthesizeResult; label: string; color: string }>;

export type OpinionSectionKey = (typeof OPINION_SECTIONS)[number]['key'];

export const enhancePromptResultSchema = z.object({
  enhancedPrompt: z.string().optional()
});
