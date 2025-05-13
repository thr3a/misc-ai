import fs from 'node:fs';
import path from 'node:path';
import { type SpineItem, initEpubFile } from '@lingo-reader/epub-parser';
import * as cheerio from 'cheerio';

const epubPath = 'ruble.epub';
const textsDir = path.join('texts');

// ファイル名に使えない文字を置換
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[\\/:*?"<>|]/g, '-');
};

// HTMLコンテンツをプレーンテキストに変換
function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  return $('body').text().trim();
}

// EPUBファイルの初期化と目次データの準備
async function initializeEpubData(filePath: string): Promise<{
  epub: Awaited<ReturnType<typeof initEpubFile>>;
  spine: SpineItem[];
  tocMap: Map<string, ReturnType<Awaited<ReturnType<typeof initEpubFile>>['getToc']>[number]>;
}> {
  const epub = await initEpubFile(filePath);
  const spine = epub.getSpine();
  const tocItems = epub.getToc();
  const tocMap = new Map(tocItems.map((item) => [item.id, item])); // item.id が undefined でないことを期待
  return { epub, spine, tocMap };
}

// 出力ディレクトリの確認と作成
function ensureOutputDirectory(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

// チャプターのタイトルを決定
function determineChapterTitle(
  spineItem: SpineItem,
  tocMap: Map<string, ReturnType<Awaited<ReturnType<typeof initEpubFile>>['getToc']>[number]>
): string | undefined {
  const tocItem = tocMap.get(spineItem.id);
  if (tocItem?.label && tocItem.label.trim() !== '表紙') {
    return tocItem.label.trim();
  }
  return undefined;
}

// チャプターのHTMLからテキストを抽出
async function extractTextFromChapterHtml(
  epub: Awaited<ReturnType<typeof initEpubFile>>,
  spineItem: SpineItem
): Promise<string> {
  const chapterData = await epub.loadChapter(spineItem.id);
  const html = chapterData?.html;
  if (!html) return '';
  return htmlToText(html);
}

// チャプターテキストをファイルに保存
function saveChapterToFile(title: string, content: string, baseFilename: string, outputDir: string): void {
  if (content.trim().length === 0) return; // 内容が空なら保存しない

  const safeTitle = sanitizeFilename(title);
  const outPath = path.join(outputDir, `${baseFilename}-${safeTitle}.txt`);
  fs.writeFileSync(outPath, content.trim(), 'utf-8');
  console.log(`saved: ${outPath}`);
}

// EPUB全体の処理を実行
async function processEpub(filePath: string, outputDir: string): Promise<void> {
  const { epub, spine, tocMap } = await initializeEpubData(filePath);
  const baseFilename = path.basename(filePath, path.extname(filePath));

  ensureOutputDirectory(outputDir);

  let currentChapterTitle: string | null = null;
  let currentChapterText = '';

  for (const spineItem of spine) {
    const titleForThisSpineItem = determineChapterTitle(spineItem, tocMap);
    const text = await extractTextFromChapterHtml(epub, spineItem);

    if (titleForThisSpineItem && titleForThisSpineItem !== currentChapterTitle) {
      if (currentChapterTitle) {
        saveChapterToFile(currentChapterTitle, currentChapterText, baseFilename, outputDir);
      }
      currentChapterTitle = titleForThisSpineItem;
      currentChapterText = text.length > 0 ? `${text}\n` : '';
    } else {
      if (text.length > 0) {
        currentChapterText += `${text}\n`;
      }
    }
  }

  // 最後の章の内容を保存
  if (currentChapterTitle) {
    saveChapterToFile(currentChapterTitle, currentChapterText, baseFilename, outputDir);
  }

  epub.destroy();
  console.log('Processing complete.');
}

async function main() {
  await processEpub(epubPath, textsDir);
}

main();
