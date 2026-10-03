import { resizeAndCompressImage } from '@/app/lib/resizeAndCompressImage';

export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_DIMENSION = 1200;
export const COMPRESSED_MEDIA_TYPE = 'image/jpeg';

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('画像の読み込みに失敗しました。'));
        return;
      }
      resolve(dataUrl);
    };
    reader.readAsDataURL(file);
  });

// 長辺がMAX_IMAGE_DIMENSIONを超える場合のみアスペクト比を維持して縮小し、JPEGのDataURLで返す
export const compressImage = async (file: File): Promise<string> => {
  const compressed = await resizeAndCompressImage(file, MAX_IMAGE_DIMENSION, 0.8);
  return readAsDataUrl(compressed);
};
