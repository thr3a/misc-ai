export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_DIMENSION = 1200;
export const COMPRESSED_MEDIA_TYPE = 'image/jpeg';

// 長辺がMAX_IMAGE_DIMENSIONを超える場合のみアスペクト比を維持して縮小し、JPEGのDataURLで返す
export const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('画像の読み込みに失敗しました。'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('画像の解析に失敗しました。'));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('画像の処理に失敗しました。'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(COMPRESSED_MEDIA_TYPE, 0.8));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
