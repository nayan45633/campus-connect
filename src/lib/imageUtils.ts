/**
 * Image processing utilities for client-side avatar and banner uploads
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface BannerPreset {
  id: string;
  name: string;
  gradient: string;
  previewBg: string;
}

export const bannerPresets: readonly BannerPreset[] = [
  {
    id: 'indigo_horizon',
    name: 'Indigo Horizon',
    gradient: 'from-indigo-700 via-indigo-600 to-indigo-950',
    previewBg: 'bg-gradient-to-r from-indigo-700 to-indigo-950',
  },
  {
    id: 'sunset_aurora',
    name: 'Sunset Aurora',
    gradient: 'from-rose-600 via-amber-600 to-purple-900',
    previewBg: 'bg-gradient-to-r from-rose-600 to-purple-900',
  },
  {
    id: 'emerald_canopy',
    name: 'Emerald Canopy',
    gradient: 'from-emerald-700 via-teal-600 to-cyan-950',
    previewBg: 'bg-gradient-to-r from-emerald-700 to-cyan-950',
  },
  {
    id: 'royal_violet',
    name: 'Royal Violet',
    gradient: 'from-violet-700 via-purple-700 to-indigo-900',
    previewBg: 'bg-gradient-to-r from-violet-700 to-indigo-900',
  },
  {
    id: 'ocean_depths',
    name: 'Ocean Depths',
    gradient: 'from-sky-600 via-blue-700 to-slate-900',
    previewBg: 'bg-gradient-to-r from-sky-600 to-slate-900',
  },
  {
    id: 'golden_dusk',
    name: 'Golden Dusk',
    gradient: 'from-amber-600 via-orange-600 to-zinc-900',
    previewBg: 'bg-gradient-to-r from-amber-600 to-zinc-900',
  },
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_RAW_FILE_SIZE_BYTES = 6 * 1024 * 1024; // 6MB

/**
 * Validates file MIME type and raw size
 */
export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPEG, PNG, WebP, or GIF).',
    };
  }

  if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeInMb}MB). Maximum allowed size is 6MB.`,
    };
  }

  return { valid: true };
}

interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  cropToRatio?: number; // e.g. 1 for square avatar, 3 for banner
}

/**
 * Resizes and center-crops an image file via HTMLCanvas to produce a compact Base64 data URL
 * safe for localStorage persistence.
 */
export function resizeAndCompressImage(
  file: File,
  options: ResizeOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          const { maxWidth, maxHeight, quality = 0.85, cropToRatio } = options;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.naturalWidth;
          let sourceHeight = img.naturalHeight;

          // If a specific target aspect ratio is requested (e.g. 1:1 for avatar), calculate crop
          if (cropToRatio) {
            const currentRatio = sourceWidth / sourceHeight;
            if (currentRatio > cropToRatio) {
              // Image is wider than desired ratio
              const newWidth = sourceHeight * cropToRatio;
              sourceX = (sourceWidth - newWidth) / 2;
              sourceWidth = newWidth;
            } else if (currentRatio < cropToRatio) {
              // Image is taller than desired ratio
              const newHeight = sourceWidth / cropToRatio;
              sourceY = (sourceHeight - newHeight) / 2;
              sourceHeight = newHeight;
            }
          }

          // Calculate output dimensions
          let outputWidth = sourceWidth;
          let outputHeight = sourceHeight;

          if (outputWidth > maxWidth) {
            outputHeight = (maxWidth / outputWidth) * outputHeight;
            outputWidth = maxWidth;
          }

          if (outputHeight > maxHeight) {
            outputWidth = (maxHeight / outputHeight) * outputWidth;
            outputHeight = maxHeight;
          }

          outputWidth = Math.round(outputWidth);
          outputHeight = Math.round(outputHeight);

          const canvas = document.createElement('canvas');
          canvas.width = outputWidth;
          canvas.height = outputHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to obtain canvas 2D rendering context'));
            return;
          }

          // Draw cropped & scaled image
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            outputWidth,
            outputHeight
          );

          // Export as JPEG with controlled compression quality
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image element for resizing'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk'));
    };

    reader.readAsDataURL(file);
  });
}
