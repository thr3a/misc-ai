'use server';

import { schema } from '@/app/ggr-en/util';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

export async function SuggestSearchQueries(input: string) {
  'use server';

  const { object: queries } = await generateObject({
    model: openai('gpt-4o'),
    system: 'Please list the five most suitable search queries in English when searching Google to solve the problem written in Input.',
    prompt: input,
    schema: schema,
    temperature: 0.4
  });

  return { queries };
}
