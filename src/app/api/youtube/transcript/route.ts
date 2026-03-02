import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPageTitle, getYouTubeTranscript } from '../util';

const requestSchema = z.object({
  url: z.string()
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 'error', message: 'Parse error' }, { status: 400 });
  }

  const schema = requestSchema.safeParse(body);
  if (!schema.success) {
    return NextResponse.json(
      { status: 'error', message: 'Validation error', errors: schema.error.issues },
      { status: 400 }
    );
  }

  try {
    const transcribedText = await getYouTubeTranscript(schema.data.url);
    const title = await getPageTitle(schema.data.url);
    return NextResponse.json({ status: 'ok', title, transcribed: transcribedText });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
