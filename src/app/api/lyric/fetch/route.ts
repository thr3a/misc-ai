import type { NextRequest } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  url: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = requestSchema.parse(body);

    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://franks543-lyric-get.vercel.app/api/lyric/get/${encodedUrl}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      return Response.json({ error: `外部APIエラー: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
