import fs from 'node:fs';
import { geminiNoneFilters } from '@/lib/google';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
// import * as youtubedlexec from 'youtube-dl-exec';
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
    // YouTube動画を音声のみで一時ファイルにダウンロード
    const { create: createYoutubeDl } = youtubedlexec;
    const youtubedl = createYoutubeDl('/usr/bin/yt-dlp_linux'); // youtube-dlのパスは適宜変更してください
    const outputPath = `/tmp/${Date.now()}.mp3`;

    // 処理の開始時間
    const startDownloadTime = Date.now();
    await youtubedl(schema.data.url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: outputPath
    });
    const downloadDuration = (Date.now() - startDownloadTime) / 1000; // 秒に変換
    console.log(`YouTube動画のダウンロード時間: ${downloadDuration.toFixed(2)}秒`);

    // Whisper APIで文字起こし
    const startTranscriptionTime = Date.now();
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: 'whisper-1',
      response_format: 'json',
      language: 'ja'
    });
    const transcribedText = transcriptionResponse.text;
    const transcriptionDuration = (Date.now() - startTranscriptionTime) / 1000; // 秒に変換
    console.log(`文字起こし時間: ${transcriptionDuration.toFixed(2)}秒`);

    // ChatGPT APIに文字起こし結果を送信して要約
    const startSummaryTime = Date.now();
    const result = await generateText({
      model: google('models/gemini-1.5-flash-latest', geminiNoneFilters),
      system: systemPrompt,
      prompt: transcribedText
    });
    const summaryDuration = (Date.now() - startSummaryTime) / 1000; // 秒に変換
    console.log(`要約生成時間: ${summaryDuration.toFixed(2)}秒`);

    // 合計時間を表示
    const totalDuration = downloadDuration + transcriptionDuration + summaryDuration;
    console.log(`合計処理時間: ${totalDuration.toFixed(2)}秒`);

    // 一時ファイルを削除
    fs.unlinkSync(outputPath);

    // 要約結果をJSON形式で返却
    return NextResponse.json({ status: 'ok', result: result.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: 'ng', message: 'Internal Server Error' }, { status: 500 });
  }
}
