import type { FileUIPart } from 'ai';
import { resizeAndCompressImage } from '@/app/lib/resizeAndCompressImage';

const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('画像の読み込みに失敗しました'));
        return;
      }
      resolve(dataUrl);
    };
    reader.readAsDataURL(file);
  });

// PromptInput から受け取るのは DataURL 化済みの FileUIPart なので、File に戻してから圧縮する
export const compressImage = async (part: FileUIPart): Promise<FileUIPart> => {
  const blob = await (await fetch(part.url)).blob();
  const file = new File([blob], part.filename ?? 'image', { type: part.mediaType });
  const compressed = await resizeAndCompressImage(file, MAX_IMAGE_DIMENSION, JPEG_QUALITY);
  return {
    ...part,
    mediaType: compressed.type,
    filename: compressed.name,
    url: await readAsDataUrl(compressed)
  };
};
