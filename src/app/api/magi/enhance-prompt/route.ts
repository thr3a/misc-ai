import { promptEnhancerSystemPrompt } from '@/app/magi/util';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(1, 'prompt is required')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedFields = requestSchema.safeParse(body);

    if (!validatedFields.success) {
      return Response.json(
        {
          error: 'Invalid request body',
          details: z.flattenError(validatedFields.error).fieldErrors
        },
        { status: 400 }
      );
    }

    const { prompt } = validatedFields.data;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: promptEnhancerSystemPrompt,
      prompt,
      temperature: 0
    });
    return Response.json({ enhancedPrompt: text });
  } catch (error) {
    console.log(error);

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return Response.json({ error: message, stack }, { status: 500 });
  }
}
