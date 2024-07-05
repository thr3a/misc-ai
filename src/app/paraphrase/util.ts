import { z } from 'zod';

export const schema = z.object({
  words: z
    .array(
      z.object({
        word: z.string().describe('異なる言い回しの日本語')
      })
    )
    .describe('異なる言い回しの日本語の5つの配列')
});
