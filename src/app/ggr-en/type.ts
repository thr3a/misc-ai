import { z } from 'zod';

export const schema = z.object({
  queries: z
    .array(
      z.object({
        query: z.string().describe('検索クエリ')
      })
    )
    .describe('検索クエリの配列')
});
