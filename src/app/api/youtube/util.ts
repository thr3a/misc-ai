import * as cheerio from 'cheerio';
import { fetchTranscript, toPlainText } from 'youtube-transcript-plus';

export async function getPageTitle(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
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
  const transcribed = await fetchTranscript(url, {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    lang: 'ja'
  });

  return toPlainText(transcribed, ' ');
};
