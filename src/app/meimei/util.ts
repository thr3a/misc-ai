import { z } from 'zod';

export const schema = z.object({
  candidates: z
    .array(
      z.object({
        candidate: z.string().describe('命名候補')
      })
    )
    .describe('6つの命名候補の配列')
});

export const supportedNamingConventions: Array<{ name: string; label: string }> = [
  {
    name: 'camel case',
    label: 'キャメルケース 例:getFullYear'
  },
  {
    name: 'pascal case',
    label: 'パスカルケース 例:GetFullYear'
  },
  {
    name: 'snake case',
    label: 'スネークケース 例:get_full_year'
  },
  {
    name: 'kebab case',
    label: 'ケバブケース 例:get-full-year'
  }
];
