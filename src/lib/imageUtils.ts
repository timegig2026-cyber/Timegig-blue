/**
 * Compresses an image to stay safely under the 1MB Firestore limit, and safely handles non-image files.
 */
export async function compressImage(base64Str: string, maxWidth = 600, quality = 0.4): Promise<string> {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    // If non-image, truncate if too large to prevent Firestore 1MB error
    if (base64Str.length > 200 * 1024) {
      return base64Str.substring(0, 200 * 1024);
    }
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}
