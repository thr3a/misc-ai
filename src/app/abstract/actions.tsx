'use server';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { abstractSystemPrompt, materializeSystemPrompt } from './util';

export async function generate(message: string, mode: 'abstract' | 'materialize') {
  'use server';

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: mode === 'abstract' ? abstractSystemPrompt : materializeSystemPrompt,
    prompt: message,
    temperature: 1
  });

  return { output: text };
}
