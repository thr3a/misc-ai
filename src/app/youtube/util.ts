import dedent from 'ts-dedent';
import { z } from 'zod';

// リクエストスキーマ定義
const requestSchema = z.object({
  url: z.string(),
  key: z.string()
});

export async function fetchTranscript(url: string) {
  const res = await fetch('/api/youtube', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      key: process.env.SECRET_KEY
    })
  });

  if (!res.ok) {
    return { status: 'ng', message: 'Internal Server Error' };
  }

  const data = await res.json();
  return data;
}

export const systemPrompt = dedent`
以下の字幕の内容に基づいてユーザーの質問に答えてください。
字幕にない内容については「わかりません」と答えてください。
`;
