import { type NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { z } from 'zod';
import { getPageTitle } from './util';

export type SuccessResponseSchema = {
  status: 'ok';
  title: string;
  transcribed: string;
};

const requestSchema = z.object({
  url: z.string(),
  key: z.string()
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

  if (process.env.SECRET_KEY !== schema.data.key) {
    return NextResponse.json(
      {
        status: 'ng',
        errorMessage: 'key error'
      },
      { status: 400 }
    );
  }

  try {
    const transcribed = await YoutubeTranscript.fetchTranscript(schema.data.url, { lang: 'ja' });
    const transcribedText = transcribed.map((x) => x.text).join('');
    const title = await getPageTitle(schema.data.url);

    return NextResponse.json({ status: 'ok', title: title, transcribed: transcribedText } as SuccessResponseSchema);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ status: 'ng', message: 'Internal Server Error' }, { status: 500 });
  }
}
