import type { AnkiRow } from '@/app/art-quiz/util';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { type NextRequest, NextResponse } from 'next/server';

const SHEET_ID = '1AuPZohWbAXg-u9G9gNU7vnk1204iDFlk6eOtTDkzBrY';
const SHEET_NAME = '暗記表';

export async function GET(req: NextRequest) {
  const doc = new GoogleSpreadsheet(SHEET_ID, { apiKey: process.env.GOOGLE_SHEETS_API_KEY || 'dummy' });
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    return NextResponse.json({ error: `シート「${SHEET_NAME}」が見つかりません` }, { status: 404 });
  }

  const rows = await sheet.getRows();
  const allRows: AnkiRow[] = rows.map((row) => row.toObject() as AnkiRow);

  const { searchParams } = req.nextUrl;
  const genre = searchParams.get('genre');

  // ジャンル指定時は該当ジャンルのみ、未指定時は全件
  const filtered = genre ? allRows.filter((row) => row.ジャンル === genre) : allRows;

  // JSON形式で返す
  return NextResponse.json(filtered, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
