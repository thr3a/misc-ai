import fs from 'node:fs';
import path from 'node:path';
import { initEpubFile } from '@lingo-reader/epub-parser';
import type { EpubFile, NavPoint } from '@lingo-reader/epub-parser'; // EpubTocItem を NavPoint に変更
import * as cheerio from 'cheerio';

const epubFilePath = 'ruble.epub';
const outputDir = 'texts';

const sanitizeFilename = (filename: string): string => {
  // ファイル名に使えない文字をハイフンに置換 (必要に応じて他の文字も追加)
  return filename.replace(/[\\/:*?"<>|]/g, '-');
};

const extractTextFromHtml = (html: string): string => {
  const $ = cheerio.load(html);
  // スクリプトやスタイルタグを除去
  $('script, style').remove();
  // body内のテキストを取得し、余分な空白や改行を整理
  return $('body').text().replace(/\s+/g, ' ').trim();
};

const parseEpubToText = async () => {
  let epub: EpubFile | undefined;
  try {
    epub = await initEpubFile(epubFilePath);

    const toc = epub.getToc();
    const spine = epub.getSpine(); // Spineも取得しておく

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const epubFilenameBase = path.basename(epubFilePath, '.epub');

    // 目次情報を元に章を処理
    const processTocItem = async (item: NavPoint, index: number) => {
      // EpubTocItem を NavPoint に変更
      console.log(`  処理中 (${index + 1}/${toc.length}): ${item.label}`);

      // hrefから章のIDを取得 (resolveHrefがundefinedを返す場合があるため注意)
      const resolved = epub?.resolveHref(item.href);
      if (!resolved) {
        // console.warn(`    - hrefを解決できませんでした: ${item.href} (スキップします)`);
        return; // 解決できない場合はスキップ
      }
      const chapterId = resolved.id;

      // SpineにIDが存在するか確認 (念のため)
      // const spineItem = spine.find((s) => s.id === chapterId);
      // if (!spineItem) {
      //   // console.warn(`    - SpineにIDが見つかりません: ${chapterId} (スキップします)`);
      //   return; // Spineにない場合もスキップ
      // }

      try {
        const chapter = await epub?.loadChapter(chapterId);

        if (chapter?.html) {
          const textContent = extractTextFromHtml(chapter.html);

          // ファイル名を生成 (目次のラベルを使用)
          const chapterTitle = sanitizeFilename(item.label || `chapter-${index + 1}`); // ラベルがない場合のフォールバック
          const outputFilename = `${epubFilenameBase}-${chapterTitle}.txt`;
          const outputPath = path.join(outputDir, outputFilename);

          fs.writeFileSync(outputPath, textContent);
          // console.log(`    - 保存しました: ${outputFilename}`);
        } else {
          // console.warn(`    - 章のコンテンツを取得できませんでした: ${chapterId}`);
        }
      } catch (error) {
        // console.error(`    - 章の処理中にエラーが発生しました (${chapterId}):`, error);
      }

      // 子要素も再帰的に処理 (必要な場合)
      // if (item.children) {
      //   for (const child of item.children) {
      //     await processTocItem(child, index); // indexの扱いは要検討
      //   }
      // }
    };

    // 目次の各項目を処理
    for (let i = 0; i < toc.length; i++) {
      await processTocItem(toc[i], i);
    }
  } catch (error) {
    console.error('EPUBのパース中にエラーが発生しました:', error);
  } finally {
    if (epub) {
      epub.destroy();
    }
  }
};

// スクリプトを実行
parseEpubToText();
