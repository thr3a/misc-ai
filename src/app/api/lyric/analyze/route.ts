import { lyricAnalysisSchema } from '@/app/lyric/type';
import { openai } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  lyric: z.string().min(1)
});

const analyzeSystemPrompt = `あなたは恋愛ソングの歌詞分析の専門家です。
与えられた歌詞を読み解き、以下の情報を抽出してください。
歌詞から読み取れる情報に基づいて、できるだけ具体的に分析してください。

【スキーマ】
${JSON.stringify(z.toJSONSchema(lyricAnalysisSchema))}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lyric } = requestSchema.parse(body);

    const result = streamText({
      model: openai('gpt-5.2'),
      system: analyzeSystemPrompt,
      prompt: lyric,
      output: Output.object({ schema: lyricAnalysisSchema })
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
