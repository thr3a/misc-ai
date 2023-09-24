// NOTE:output: 'export' だとエラーになる

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  name: z.string()
});

export function GET (req: NextRequest): NextResponse {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = requestSchema.safeParse(params);
  console.log(params, result);

  if (!result.success) {
    const { errors } = result.error;
    return NextResponse.json({
      status: 'ng',
      errors
    }, { status: 400 });
  }

  return NextResponse.json({
    status: 'ok',
    result: params
  });
}

export async function POST (req: NextRequest): Promise<NextResponse> {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({
      status: 'ng',
      errorMessage: 'Parse error'
    });
  }
  const result = requestSchema.safeParse(body);
  if (!result.success) {
    const { errors } = result.error;
    return NextResponse.json({
      status: 'ng',
      errorMessage: 'Validation error',
      errors
    }, { status: 400 });
  }
  return NextResponse.json({
    status: 'ok',
    result: body
  });
}
