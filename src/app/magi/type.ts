import { z } from 'zod';

export const synthesizeResultSchema = z.object({
  commonOpinions: z.array(z.string()).describe('共通している意見 2名以上の回答者が共通して支持している主張のリスト'),
  conflictingOpinions: z.array(z.string()).describe('対立している意見 回答者間で意見が分かれている主張のリスト')
});

export type SynthesizeResult = z.infer<typeof synthesizeResultSchema>;
