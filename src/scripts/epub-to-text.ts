// epubファイルを章ごとにテキスト化して保存するスクリプト
// @lingo-reader/epub-parser, cheerio利用
// 使い方: node --import tsx src/scripts/epub-to-text.ts

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  type EpubFile,
  type EpubFileInfo,
  type EpubProcessedChapter,
  type EpubResolvedHref,
  type NavPoint,
  initEpubFile
} from '@lingo-reader/epub-parser';
import * as cheerio from 'cheerio';

// サンプルepubファイルのパス
const epubPath = 'ルーヴル美術館ブランディングの百年.epub';
// 出力ディレクトリ
const outputDir = 'texts';

// ファイル名として使えない文字を_に変換
function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

/**
 * tocのchildrenも含めて再帰的に処理
 * @param tocItems TocItem[]
 * @param epub EpubFile
 * @param fileBase string
 */
async function processTocItems(tocItems: NavPoint[], epub: EpubFile, fileBase: string) {
  for (const item of tocItems) {
    const chapterLabel = item?.label || 'no-title';
    const safeLabel = sanitizeFileName(chapterLabel);
    // hrefからidを取得
    const resolved: EpubResolvedHref | undefined = epub.resolveHref(item?.href);
    if (resolved?.id) {
      const chapter: EpubProcessedChapter | undefined = await epub.loadChapter(resolved.id);
      if (chapter?.html) {
        // cheerioでbody部のテキスト抽出
        const $ = cheerio.load(chapter.html);
        const text = $('body').text().trim();
        if (text.length > 0) {
          const outPath = path.join(outputDir, `${fileBase}-${safeLabel}.txt`);
          await fs.writeFile(outPath, text, 'utf8');
          console.log(`saved: ${outPath}`);
        }
      }
    }
    // 子章があれば再帰
    if (Array.isArray(item.children)) {
      await processTocItems(item.children, epub, fileBase);
    }
  }
}

async function main() {
  // textsディレクトリ作成
  await fs.mkdir(outputDir, { recursive: true });

  // epubファイルをパース
  const epub: EpubFile = await initEpubFile(epubPath);
  const fileInfo: EpubFileInfo = epub.getFileInfo();
  const fileBase = sanitizeFileName(fileInfo?.fileName?.replace(/\.epub$/i, '') || 'epub');

  // 目次取得
  const toc: NavPoint[] = epub.getToc();

  // 章ごとにテキスト抽出・保存
  await processTocItems(toc, epub, fileBase);

  epub.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
