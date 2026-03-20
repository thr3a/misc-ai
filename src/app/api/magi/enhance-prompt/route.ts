// jo 'prompt=スプラはなぜ面白い？'| curl 'localhost:3000/api/magi/enhance-prompt/' --json @-

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { promptEnhancerSystemPrompt } from '@/app/magi/util';

const requestSchema = z.object({
  prompt: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { prompt } = requestSchema.parse(body);

    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: promptEnhancerSystemPrompt,
      prompt,
      temperature: 0
    });
    return Response.json({ enhancedPrompt: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
