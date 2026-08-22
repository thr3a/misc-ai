// jo 'prompt=今のドル円は？'| curl 'localhost:3000/api/magi/recon/' --json @-
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import dayjs from 'dayjs';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { ReconResult, ReconSource } from '@/app/magi/type';
import { reconSystemPrompt } from '@/app/magi/util';

export const maxDuration = 300;

const requestSchema = z.object({
  prompt: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = requestSchema.parse(body);

    const { text, sources } = await generateText({
      model: openai('gpt-5.6-terra'),
      instructions: reconSystemPrompt,
      prompt: buildReconPrompt(prompt),
      tools: {
        web_search: openai.tools.webSearch({
          searchContextSize: 'medium',
          userLocation: { type: 'approximate', country: 'JP', timezone: 'Asia/Tokyo' }
        })
      },
      providerOptions: {
        openai: {
          reasoningEffort: 'low'
        } satisfies OpenAIResponsesProviderOptions
      }
    });

    // 同一URLが複数回引用されることがあるため重複を除去する
    const seen = new Set<string>();
    const uniqueSources: ReconSource[] = [];
    for (const source of sources) {
      if (source.sourceType !== 'url' || seen.has(source.url)) continue;
      seen.add(source.url);
      uniqueSources.push({ url: source.url, title: source.title ?? source.url });
    }

    const result: ReconResult = { summary: stripInlineCitations(text), sources: uniqueSources };
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

// web検索の引用は本文にMarkdownリンクとして埋め込まれるため、出典リストに任せて本文からは取り除く
const stripInlineCitations = (text: string): string =>
  text
    .replace(/\(\[[^\]]*\]\([^)]*\)\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .trim();

const buildReconPrompt = (prompt: string): string =>
  `現在の日時: ${dayjs().format('YYYY年M月D日 HH:mm')}\n次の質問に答えるために必要な最新情報を調べてください。\n${prompt}`;
