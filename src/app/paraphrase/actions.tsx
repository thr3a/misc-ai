'use server';

import { schema } from '@/app/paraphrase/util';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

export async function SuggestWords(input: string, context: string) {
  'use server';

  const prompt = `
#Task
あなたは文章表現の専門家です。
より豊かな言葉で表現することで、コンテンツの品質を向上させるため、
「${input}」という文章を #Context に適した異なる言い回し・類語・関連語のワードに変換して5つ提案してください。

#Context
${context}

#Rules
- 提案されるワードは、元の文章のニュアンスや意味を維持しつつ、異なる表現を用いること
- 提案されるワードは重複したり単調になってはいけません。
`;
  console.log(prompt);

  const { object: words } = await generateObject({
    model: openai('gpt-4o'),
    prompt: prompt,
    schema: schema,
    temperature: 0.6
  });

  return { words };
}
