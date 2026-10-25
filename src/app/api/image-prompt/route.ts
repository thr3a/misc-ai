import { createOpenAI, openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { buildExpandSystemPrompt, reviseSystemPrompt, translateSystemPrompt } from '@/app/image-prompt/util';

// リクエストボディのスキーマ定義
const requestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('expand'),
    model: z.enum(['openai', 'local']),
    prompt: z.string().min(1),
    systemPrompt: z.string().min(1)
  }),
  z.object({
    mode: z.literal('revise'),
    model: z.enum(['openai', 'local']),
    prompt: z.string().min(1),
    instruction: z.string().min(1)
  }),
  z.object({
    mode: z.literal('translate'),
    model: z.enum(['openai', 'local']),
    prompt: z.string().min(1)
  })
]);

const localOpenAI = createOpenAI({
  baseURL: 'https://chatgpt-api.turai.work/v1'
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

    const data = validatedFields.data;
    const model = data.model === 'openai' ? openai('gpt-5.6-terra') : localOpenAI.chat('main');

    const { text } = await generateText(
      data.mode === 'expand'
        ? { model, instructions: buildExpandSystemPrompt(data.systemPrompt), prompt: data.prompt }
        : data.mode === 'revise'
          ? {
              model,
              instructions: reviseSystemPrompt,
              prompt: `【現在のプロンプト】\n${data.prompt}\n\n【修正指示】\n${data.instruction}`
            }
          : { model, instructions: translateSystemPrompt, prompt: data.prompt }
    );

    return Response.json({ text: text.trim() });
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
