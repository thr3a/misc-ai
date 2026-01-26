import * as cheerio from 'cheerio';
import dedent from 'ts-dedent';
import { Client } from 'youtubei';

export const systemPrompt = dedent`
あなたは、YouTubeの動画内容を要約する専門家です。
入力された動画のタイトルと文字起こしから以下の2つのタスクを実行してください。
1. 動画のタイトルに対する具体的な回答を箇条書きで作成してください。この回答は、タイトルが提起する質問や主題に直接関連する内容であるべきです。
2. 動画の主張の要約を5つの箇条書きで作成してください。これは動画全体の主要なポイントや結論を簡潔に表現するものです。

# 出力制約事項
- 文字起こしのテキストには誤字脱字がある可能性があります。
- 太字装飾禁止のマークダウン記法で出力してください。
`;

export async function getPageTitle(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      'Accept-Language': 'ja'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTPエラー: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const title = $('title').text().trim();
  return title;
}

export function getYouTubeVideoId(url: string): string | null {
  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube(?:-nocookie)?\.com\/(?:v\/|watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export const getYouTubeTranscript = async (url: string): Promise<string> => {
  const youtube = new Client({
    youtubeClientOptions: {
      hl: 'ja',
      gl: 'ja'
    }
  });

  const videoId = getYouTubeVideoId(url);
  if (videoId === null) {
    throw new Error('YouTubeのURLが不正です');
  }

  const video = await youtube.getVideo(videoId);

  if (!video) {
    throw new Error('動画情報を取得できませんでした');
  }

  if (!video.captions) {
    throw new Error('字幕がありませんでした');
  }

  const availableLanguageCodes = video.captions.languages.map((language) => language.code) ?? [];

  const languageCode = availableLanguageCodes.includes('ja')
    ? 'ja'
    : availableLanguageCodes.includes('en')
      ? 'en'
      : availableLanguageCodes[0];

  const transcribed = (await video.captions?.get(languageCode)) ?? [];

  const transcribedText = transcribed
    .map((caption) => caption.text)
    .join('')
    .replaceAll(/[\n|,]/g, '');

  return transcribedText;
};
