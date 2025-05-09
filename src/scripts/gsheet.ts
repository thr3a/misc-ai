import { GoogleSpreadsheet } from 'google-spreadsheet';

import type { AnkiRow } from '../app/art-quiz/util';

const SHEET_ID = '1AuPZohWbAXg-u9G9gNU7vnk1204iDFlk6eOtTDkzBrY';
const SHEET_NAME = '暗記表';
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

async function main() {
  if (!API_KEY) {
    console.error('GOOGLE_SHEETS_API_KEYが.envに設定されていません');
    process.exit(1);
  }

  const doc = new GoogleSpreadsheet(SHEET_ID, { apiKey: API_KEY });

  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    console.error(`シート「${SHEET_NAME}」が見つかりません`);
    process.exit(1);
  }

  const rows = await sheet.getRows();

  const ankiRows: AnkiRow[] = rows.map((row) => row.toObject() as AnkiRow);
  for (const ankiRow of ankiRows) {
    console.log(ankiRow);
  }
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
