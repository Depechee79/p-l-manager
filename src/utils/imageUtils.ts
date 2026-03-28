const DEFAULT_MAX_WIDTH = 800;
const DEFAULT_QUALITY = 0.6;

/**
 * Compresses an image file to a base64 string with specified max width and quality.
 * @param file The image file to compress.
 * @param maxWidth The maximum width of the output image.
 * @param quality The quality of the JPEG output (0 to 1).
 * @returns A promise that resolves to the base64 string of the compressed image.
 */
export function compressImage(file: File, maxWidth: number = DEFAULT_MAX_WIDTH, quality: number = DEFAULT_QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader did not return a string'));
        return;
      }
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Converts a PDF file to a base64 string (no compression, just conversion).
 * For PDFs, we might just store the raw base64 or a placeholder if it's too big.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader did not return a string'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}
