/**
 * 画像をリサイズ・JPEG圧縮するユーティリティ関数
 * Chrome/Android/iOS Safari対応
 * @param file 入力画像ファイル
 * @param maxSize 最大幅・高さ(px)
 * @param quality JPEG画質(0.0-1.0)
 * @returns 圧縮後のFile
 */
export async function resizeAndCompressImage(file: File, maxSize = 1024, quality = 0.8): Promise<File> {
  // 既に十分小さいJPEG画像ならそのまま返す
  if (file.size < 1024 * 1024 && file.type === 'image/jpeg') {
    return file;
  }
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return reject(new Error('画像の読み込みに失敗しました'));
      img.onload = () => {
        // リサイズ計算
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvasが利用できません'));

        ctx.drawImage(img, 0, 0, width, height);

        // Safari古いバージョン対策: toBlob未対応ならtoDataURLで代替
        if (canvas.toBlob) {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('画像圧縮に失敗しました'));
              // File名・typeを維持
              const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: 'image/jpeg'
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        } else {
          // toBlob未対応（iOS12以前等）: toDataURLで代替
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          // DataURL→Blob
          const arr = dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          const blob = new Blob([u8arr], { type: mime });
          const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg'
          });
          resolve(compressedFile);
        }
      };
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = e.target.result as string;
    };
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}
