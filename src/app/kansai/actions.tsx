'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { schema, systemPrompt } from './util';

export async function Generate(input: string) {
  'use server';

  const { object } = await generateObject({
    model: openai('gpt-5'),
    system: systemPrompt,
    prompt: input,
    schema: schema,
    temperature: 0.3,
    providerOptions: {
      openai: {
        reasoningEffort: 'minimal'
      }
    }
  });

  return { object };
}
