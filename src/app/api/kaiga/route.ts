import { schema } from '@/app/kaiga/type';
import { systemPrompt } from '@/app/kaiga/util';
import { openai } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export const maxDuration = 30;

const requestSchema = z.object({
  imageDataUrl: z.string().min(1)
});

const parseDataUrl = (dataUrl: string): { mediaType: string; data: Uint8Array } | null => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mediaType = match[1] ?? '';
  const base64 = match[2] ?? '';
  if (!mediaType.startsWith('image/')) return null;
  const data = Buffer.from(base64, 'base64');
  return { mediaType, data };
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

    const parsed = parseDataUrl(validatedFields.data.imageDataUrl);
    if (!parsed) {
      return Response.json({ error: '画像データの形式が不正です。' }, { status: 400 });
    }

    if (parsed.data.byteLength > 6 * 1024 * 1024) {
      return Response.json({ error: '画像サイズが大きすぎます。' }, { status: 413 });
    }

    const result = streamText({
      model: openai('gpt-4.1'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'この画像の絵画（またはモチーフ）について、スキーマに従って情報を出力してください。'
            },
            { type: 'image', image: parsed.data, mediaType: parsed.mediaType }
          ]
        }
      ],
      output: Output.object({ schema }),
      temperature: 0
    });

    return result.toTextStreamResponse();
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
