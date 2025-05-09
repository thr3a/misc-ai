import { GoogleSpreadsheet } from 'google-spreadsheet';
import { type NextRequest, NextResponse } from 'next/server';

// 型定義はsrc/app/art-quiz/util.tsに移す前提
export type AnkiRow = {
  ジャンル: string;
  副題: string;
  タイトル: string;
  タグ1?: string;
  タグ2?: string;
  タグ3?: string;
};

const SHEET_ID = '1AuPZohWbAXg-u9G9gNU7vnk1204iDFlk6eOtTDkzBrY';
const SHEET_NAME = '暗記表';
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

export async function GET(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_SHEETS_API_KEYが設定されていません' }, { status: 500 });
  }

  const doc = new GoogleSpreadsheet(SHEET_ID, { apiKey: API_KEY });
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    return NextResponse.json({ error: `シート「${SHEET_NAME}」が見つかりません` }, { status: 404 });
  }

  const rows = await sheet.getRows();
  // ジャンル=ギリシャ神話のみ
  const filtered: AnkiRow[] = rows
    .map((row) => row.toObject() as AnkiRow)
    .filter((row) => row.ジャンル === 'ギリシャ神話');

  // JSON形式で返す
  return NextResponse.json(filtered, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
