import { geminiNoneFilters } from '@/lib/google';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { z } from 'zod';
import { systemPrompt } from './util';

// OpenAI APIキーを設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? 'dummy' // 環境変数からAPIキーを読み込む
});

// リクエストスキーマ定義
const requestSchema = z.object({
  url: z.string()
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({
      status: 'ng',
      errorMessage: 'Parse error'
    });
  }
  const schema = requestSchema.safeParse(body);
  if (!schema.success) {
    const { errors } = schema.error;
    return NextResponse.json(
      {
        status: 'ng',
        errorMessage: 'Validation error',
        errors
      },
      { status: 400 }
    );
  }

  try {
    const transcribedText = await YoutubeTranscript.fetchTranscript(schema.data.url, { lang: 'ja' });

    // ChatGPT APIに文字起こし結果を送信して要約
    const result = await generateText({
      model: google('models/gemini-1.5-flash-latest', geminiNoneFilters),
      system: systemPrompt,
      prompt: transcribedText.map((x) => x.text).join('')
    });

    // 要約結果をJSON形式で返却
    return NextResponse.json({ status: 'ok', result: result.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: 'ng', message: 'Internal Server Error' }, { status: 500 });
  }
}
