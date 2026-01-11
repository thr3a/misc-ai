import { z } from 'zod';

export const schema = z.object({
  expanded_prompt: z.string().min(1).describe('拡張された画像生成用英語プロンプト'),
  expanded_prompt_ja: z.string().min(1).describe('拡張された画像生成用英語プロンプトの日本語訳')
});
