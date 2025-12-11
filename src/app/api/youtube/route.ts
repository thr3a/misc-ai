import { type NextRequest, NextResponse } from 'next/server';
import { Client } from 'youtubei';
import { z } from 'zod';
import { getPageTitle, getYouTubeVideoId } from './util';

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
    const { issues } = schema.error;
    return NextResponse.json(
      {
        status: 'ng',
        errorMessage: 'Validation error',
        errors: issues
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
    const youtube = new Client({
      youtubeClientOptions: {
        hl: 'ja',
        gl: 'ja'
      }
    });
    const videoId = getYouTubeVideoId(schema.data.url);
    if (videoId === null) {
      return NextResponse.json({ status: 'ng', message: 'Internal Server Error' }, { status: 500 });
    }
    const video = await youtube.getVideo(videoId);
    const availableLanguageCodes = await video?.captions?.languages.map((l) => l.code);
    const languageCode = availableLanguageCodes?.includes('ja')
      ? 'ja'
      : availableLanguageCodes?.includes('en')
        ? 'en'
        : availableLanguageCodes?.[0];
    const transcribed = (await video?.captions?.get(languageCode)) || [];
    const transcribedText = transcribed
      .map((x) => x.text)
      .join('')
      .replaceAll(/[\n|,]/g, '');
    const title = await getPageTitle(schema.data.url);

    return NextResponse.json({ status: 'ok', title: title, transcribed: transcribedText } as SuccessResponseSchema);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ status: 'ng', message: 'Internal Server Error' }, { status: 500 });
  }
}
