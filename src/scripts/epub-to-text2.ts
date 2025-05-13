import fs from 'node:fs';
import path from 'node:path';
import { initEpubFile } from '@lingo-reader/epub-parser';
import * as cheerio from 'cheerio';

const epubPath = 'ruble.epub';
const textsDir = path.join('texts');

// ファイル名に使えない文字を置換
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[\\/:*?"<>|]/g, '-');
};

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  return $('body').text().replace(/\s+/g, ' ').trim();
}

async function main() {
  const epub = await initEpubFile(epubPath);

  // 読書順（spine）を取得
  const spine = epub.getSpine();

  // 目次（toc）を取得し、id→labelのマップを作成
  function flattenToc(toc: any[]): { [id: string]: string } {
    const map: { [id: string]: string } = {};
    for (const item of toc) {
      map[item.id] = item.label;
      if (item.children && Array.isArray(item.children)) {
        Object.assign(map, flattenToc(item.children));
      }
    }
    return map;
  }
  const toc = epub.getToc();
  const idToLabel = flattenToc(toc);

  if (!fs.existsSync(textsDir)) {
    fs.mkdirSync(textsDir, { recursive: true });
  }

  const epubFilenameBase = path.basename(epubPath, path.extname(epubPath));

  // 章ごとに処理
  for (const item of spine) {
    const chapter = await epub.loadChapter(item.id);
    const title = idToLabel[item.id] || item.id;
    if (chapter) {
      const text = htmlToText(chapter.html);
      if (text.length === 0) {
        continue;
      }
      // ファイル名生成
      const safeTitle = sanitizeFilename(title);
      const outPath = path.join(textsDir, `${epubFilenameBase}-${safeTitle}.txt`);
      fs.writeFileSync(outPath, text, 'utf-8');
      console.log(`saved: ${outPath}`, item.id);
    }
  }

  epub.destroy();
}

main();
