'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { schema, systemPrompt } from './util';

export async function improvePrompt(input: string) {
  'use server';

  const { object: improved_prompt } = await generateObject({
    model: openai('gpt-3.5-turbo'),
    system: systemPrompt,
    prompt: input,
    schema: schema,
    temperature: 0.4
  });

  return { improved_prompt };
}
