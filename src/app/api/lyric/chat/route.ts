import type { LyricAnalysis } from '@/app/lyric/type';
import { openai } from '@ai-sdk/openai';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { type UIMessage, convertToModelMessages, streamText, validateUIMessages } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';

type ChatRequestBody = {
  messages: UIMessage[];
  lyric: string;
  analysis: LyricAnalysis;
};

const buildSystemPrompt = (lyric: string, analysis: LyricAnalysis): string => {
  const charactersDesc =
    analysis.characters.length > 0
      ? dedent`
    【その他の登場人物】
    ${analysis.characters
      .map(
        (c, i) => `登場人物${i + 1}:
    性別: ${c.gender}
    年代: ${c.ageGroup}
    語り手との関係: ${c.relationshipWithNarrator}`
      )
      .join('\n')}`
      : '【その他の登場人物】なし';

  return dedent`
  あなたは恋愛ソングの歌詞考察の専門家です。
  以下の歌詞とその分析結果を踏まえて、ユーザーの質問に答えてください。
  【語り手】
  性別: ${analysis.narrator.gender}
  年代: ${analysis.narrator.ageGroup}
  説明: ${analysis.narrator.description}

  ${charactersDesc}

  【歌詞の概要】
  ${analysis.summary}

  【歌詞全文】
  ${lyric}

歌詞の内容や登場人物の心理・関係性について、深く洞察した回答をしてください。`;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, lyric, analysis }: ChatRequestBody = await req.json();
    const validatedMessages = await validateUIMessages({ messages });

    const result = streamText({
      model: openai('gpt-5.2'),
      system: buildSystemPrompt(lyric, analysis),
      messages: await convertToModelMessages(validatedMessages),
      providerOptions: {
        openai: {
          reasoningEffort: 'high'
        } satisfies OpenAIResponsesProviderOptions
      }
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
