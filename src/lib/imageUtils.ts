/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safely converts a File or Blob object to a Base64 data URL string,
 * or returns an existing string unchanged after type verification.
 * Bypasses iframe sandbox permission locks by normalizing via createObjectURL + fetch.
 */
export async function ensureDataUrl(input: any): Promise<string> {
  console.log("UPLOAD TYPE:", typeof input, input?.constructor?.name);
  if (!input) {
    throw new Error("Invalid file or data input (null or undefined)");
  }
  if (typeof input === 'string') {
    return input;
  }
  if (!(input instanceof File || input instanceof Blob)) {
    throw new Error("Unsupported upload type: " + (typeof input));
  }

  // Normalize File/Blob via objectURL + fetch to bypass iframe sandbox permission errors
  let workingBlob: Blob = input;
  try {
    const objectUrl = URL.createObjectURL(input);
    const res = await fetch(objectUrl);
    workingBlob = await res.blob();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.warn("Blob fetch normalization fallback, using raw input", err);
  }

  // If it's an image, use URL.createObjectURL + canvas
  if (workingBlob.type && workingBlob.type.startsWith('image/')) {
    try {
      return await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(workingBlob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context creation failed"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load image for processing"));
        };
        img.src = url;
      });
    } catch (e) {
      console.warn("Canvas image loading fallback to FileReader", e);
    }
  }

  // Standard FileReader for PDFs, documents, or image fallbacks using workingBlob
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to convert file to Base64"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error("The file could not be read. Please re-select the file and click save immediately."));
    };
    try {
      reader.readAsDataURL(workingBlob);
    } catch (err) {
      reject(new Error("File access denied or locked. Please re-select the file."));
    }
  });
}

/**
 * Backwards compatible alias for ensureDataUrl
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return ensureDataUrl(file);
}

/**
 * Compresses an image defensively, ensuring input is converted to a Data URL string first.
 */
export async function compressImage(input: any, maxWidth = 600, quality = 0.4): Promise<string> {
  console.log("COMPRESS INPUT TYPE:", typeof input, input?.constructor?.name);
  const base64Str = await ensureDataUrl(input);

  if (typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
    if (typeof base64Str === 'string' && base64Str.length > 200 * 1024) {
      return base64Str.substring(0, 200 * 1024);
    }
    return typeof base64Str === 'string' ? base64Str : '';
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
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}
