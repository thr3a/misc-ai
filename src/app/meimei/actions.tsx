'use server';

import { schema } from '@/app/meimei/util';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

export async function SuggestNames(input: string, type: string, namingConvention: string) {
  'use server';

  const prompt = `
あなたはソフトウェア開発のエキスパートです。${input}に対して適切な${type}の候補を${namingConvention}形式で6つ提案してください。
各候補はプログラムの可読性と保守性を考慮して簡潔で明確な名前にし、${type}として一般的に理解しやすいものにしてください。`;

  const { object: candidates } = await generateObject({
    model: openai('gpt-4o'),
    prompt: prompt,
    schema: schema,
    temperature: 0
  });

  return { candidates };
}
