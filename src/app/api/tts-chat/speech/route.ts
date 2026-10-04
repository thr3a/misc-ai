import type { NextRequest } from 'next/server';
import type { SpeechRequestBody } from '@/app/tts-chat/type';

const TTS_ENDPOINT = 'https://irodori-tts.turai.work/v1/audio/speech';
const TTS_MODEL = 'irodori-tts';
// OpenAPI 定義の SpeechRequest.input の上限
const MAX_INPUT_LENGTH = 4096;

const buildTtsBody = ({ input, settings }: SpeechRequestBody) => {
  if (settings.mode === 'caption') {
    // caption モードでは参照音声を使わず、文章指定だけで声質を決める
    return {
      model: TTS_MODEL,
      input,
      voice: 'none',
      response_format: 'wav',
      irodori: { caption: settings.caption, no_ref: true }
    };
  }
  return { model: TTS_MODEL, input, voice: settings.voiceId, response_format: 'wav' };
};

export async function POST(req: NextRequest) {
  const body: SpeechRequestBody = await req.json();
  const input = body.input.trim().slice(0, MAX_INPUT_LENGTH);
  if (input === '') {
    return Response.json({ error: '読み上げるテキストがありません' }, { status: 400 });
  }

  const res = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTtsBody({ input, settings: body.settings }))
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error(detail);
    return Response.json({ error: `音声生成に失敗しました (${res.status})` }, { status: 502 });
  }

  return new Response(res.body, {
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'audio/wav' }
  });
}
