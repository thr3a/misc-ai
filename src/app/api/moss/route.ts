import { createOpenAI, openai } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isPresetSize, sanitizeGenerated } from '@/app/moss/draft';
import {
  buildGenerateSystemPrompt,
  buildGenerateUserPrompt,
  translateToEnglishSystemPrompt,
  translateToJapaneseSystemPrompt
} from '@/app/moss/prompt';
import { generatedLayoutSchema, translationSchema } from '@/app/moss/types';

// リクエストボディのスキーマ定義
const requestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('generate'),
    model: z.enum(['openai', 'local']),
    prompt: z.string().min(1),
    width: z.number().int(),
    height: z.number().int()
  }),
  z.object({
    mode: z.literal('translate'),
    model: z.enum(['openai', 'local']),
    target: z.enum(['en', 'ja']),
    texts: z.array(z.string()).min(1)
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
    const model = data.model === 'openai' ? openai('gpt-5.6-terra') : localOpenAI.chat('deep02-reasoning-minimum');

    if (data.mode === 'generate') {
      if (!isPresetSize(data.width, data.height)) {
        return Response.json({ error: 'Unsupported size' }, { status: 400 });
      }
      const result = await generateText({
        model,
        output: Output.object({ schema: generatedLayoutSchema }),
        instructions: buildGenerateSystemPrompt(data.width, data.height),
        prompt: buildGenerateUserPrompt(data.prompt, data.width, data.height)
      });
      const draft = sanitizeGenerated(result.output, data.width, data.height);
      if (!draft) return Response.json({ error: 'Empty layout' }, { status: 500 });
      return Response.json({ draft });
    }

    // 件数がずれると対応関係が壊れるため、一致するまで 1 回だけ再試行する
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await generateText({
        model,
        output: Output.object({ schema: translationSchema }),
        instructions: data.target === 'en' ? translateToEnglishSystemPrompt : translateToJapaneseSystemPrompt,
        prompt: JSON.stringify(data.texts)
      });
      const translations = result.output.translations.map((t) => t.trim());
      if (translations.length === data.texts.length) return Response.json({ translations });
    }
    return Response.json({ error: 'Translation count mismatch' }, { status: 500 });
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
