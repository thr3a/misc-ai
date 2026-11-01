import { createOpenAI, openai } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isPresetSize, sanitizeGenerated, sanitizeItems } from '@/app/moss/draft';
import {
  buildGenerateSystemPrompt,
  buildGenerateUserPrompt,
  buildReviseItemSystemPrompt,
  buildReviseItemUserPrompt,
  buildReviseSystemPrompt,
  buildReviseUserPrompt,
  translateToEnglishSystemPrompt,
  translateToJapaneseSystemPrompt
} from '@/app/moss/prompt';
import { editorLayoutSchema, generatedLayoutSchema, revisedItemsSchema, translationSchema } from '@/app/moss/types';

// リクエストボディのスキーマ定義
const requestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('generate'),
    model: z.enum(['openai', 'openai-sol', 'openrouter', 'local']),
    prompt: z.string().min(1),
    width: z.number().int(),
    height: z.number().int()
  }),
  z.object({
    mode: z.literal('translate'),
    model: z.enum(['openai', 'openai-sol', 'openrouter', 'local']),
    target: z.enum(['en', 'ja']),
    texts: z.array(z.string()).min(1)
  }),
  z.object({
    mode: z.literal('revise'),
    model: z.enum(['openai', 'openai-sol', 'openrouter', 'local']),
    layout: editorLayoutSchema,
    instruction: z.string().min(1)
  }),
  z.object({
    mode: z.literal('reviseItem'),
    model: z.enum(['openai', 'openai-sol', 'openrouter', 'local']),
    layout: editorLayoutSchema,
    uid: z.string().min(1),
    instruction: z.string().min(1)
  })
]);

const localOpenAI = createOpenAI({
  baseURL: 'https://chatgpt-api.turai.work/v1'
});

const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy'
});

const selectModel = (model: 'openai' | 'openai-sol' | 'openrouter' | 'local') => {
  if (model === 'openai') return openai('gpt-5.6-terra');
  if (model === 'openai-sol') return openai('gpt-6.1-sol');
  if (model === 'openrouter') return openRouter.chat('z-ai/glm-5.2');
  return localOpenAI.chat('deep02-reasoning-minimum');
};

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
    const model = selectModel(data.model);
    const providerOptions =
      data.model === 'openai' || data.model === 'openai-sol'
        ? {
            openai: {
              reasoningEffort: 'medium'
            }
          }
        : data.model === 'openrouter'
          ? {
              openai: {
                reasoningEffort: 'none',
                forceReasoning: false
              }
            }
          : undefined;

    if (data.mode === 'generate') {
      if (!isPresetSize(data.width, data.height)) {
        return Response.json({ error: 'Unsupported size' }, { status: 400 });
      }
      const result = await generateText({
        model,
        output: Output.object({ schema: generatedLayoutSchema }),
        instructions: buildGenerateSystemPrompt(data.width, data.height),
        prompt: buildGenerateUserPrompt(data.prompt, data.width, data.height),
        providerOptions
      });
      const draft = sanitizeGenerated(result.output, data.width, data.height);
      if (!draft) return Response.json({ error: 'Empty layout' }, { status: 500 });
      return Response.json({ draft });
    }

    // 全体リライト。summary と全要素をまとめて書き換える
    if (data.mode === 'revise') {
      const { width, height } = data.layout;
      if (!isPresetSize(width, height)) {
        return Response.json({ error: 'Unsupported size' }, { status: 400 });
      }
      const result = await generateText({
        model,
        output: Output.object({ schema: generatedLayoutSchema }),
        instructions: buildReviseSystemPrompt(width, height),
        prompt: buildReviseUserPrompt(data.layout, data.instruction),
        providerOptions
      });
      const draft = sanitizeGenerated(result.output, width, height);
      if (!draft) return Response.json({ error: 'Empty layout' }, { status: 500 });
      return Response.json({ draft });
    }

    // 個別リライト。対象の 1 要素を置き換える要素だけを返す
    if (data.mode === 'reviseItem') {
      const { width, height } = data.layout;
      const index = data.layout.items.findIndex((item) => item.uid === data.uid);
      if (index === -1) return Response.json({ error: 'Item not found' }, { status: 400 });
      const result = await generateText({
        model,
        output: Output.object({ schema: revisedItemsSchema }),
        instructions: buildReviseItemSystemPrompt(width, height),
        prompt: buildReviseItemUserPrompt(data.layout, index, data.instruction),
        providerOptions
      });
      const items = sanitizeItems(result.output.items, width, height);
      // 空配列は削除の指示として受け入れるが、返した要素がすべて壊れていた場合は失敗にする
      if (result.output.items.length > 0 && items.length === 0) {
        return Response.json({ error: 'Invalid items' }, { status: 500 });
      }
      return Response.json({ items });
    }

    // 件数がずれると対応関係が壊れるため、一致するまで 1 回だけ再試行する
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await generateText({
        model,
        output: Output.object({ schema: translationSchema }),
        instructions: data.target === 'en' ? translateToEnglishSystemPrompt : translateToJapaneseSystemPrompt,
        prompt: JSON.stringify(data.texts),
        providerOptions
      });
      const translations = result.output.translations.map((t) => t.trim());
      if (translations.length === data.texts.length) return Response.json({ translations });
    }
    return Response.json({ error: 'Translation count mismatch' }, { status: 500 });
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
