'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { schema, systemPrompt } from './util';

export async function Generate(input: string) {
  'use server';

  const { object } = await generateObject({
    // model: openai('gpt-4o-mini'),
    model: anthropic('claude-3-5-sonnet-20240620'),
    system: '',
    prompt: input,
    schema: schema,
    temperature: 0.3
  });

  return { object };
}
