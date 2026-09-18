/**
 * Smart Client-Side Image Compressor
 *
 * Features:
 * - Client-side non-blocking image compression before upload
 * - Automatically resizes only if longest edge > 2560px (preserves aspect ratio, never upscales)
 * - Automatically detects screenshots, graphics, diagrams, and text-heavy images to use high-quality/lossless modes
 * - Respects EXIF orientation so mobile photos do not appear rotated
 * - Targets WebP format (~85% quality by default; 94%+ for graphics/screenshots)
 * - Skips compression if file is already lightweight or if re-encoding increases size
 * - Non-blocking execution with createImageBitmap / async micro-tasks
 * - Graceful fallback to original file if compression encounters any error
 */

export interface CompressionResult {
  file: File;
  originalFile: File;
  originalSize: number;
  compressedSize: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  format: 'image/webp' | 'image/jpeg' | 'image/png';
  savedBytes: number;
  savedPercent: number;
  isCompressed: boolean;
  isGraphicOrScreenshot: boolean;
  compressionTimeMs: number;
  previewUrl: string;
}

export interface CompressionOptions {
  maxDimension?: number; // default 2560px
  quality?: number; // default 0.85
  graphicQuality?: number; // default 0.94 for screenshots/graphics
  skipThresholdBytes?: number; // default 120 KB
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxDimension: 2560,
  quality: 0.85,
  graphicQuality: 0.94,
  skipThresholdBytes: 120 * 1024, // 120 KB
};

/**
 * Format bytes into human-readable string (e.g. "1.2 MB", "420 KB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Checks if the file name or type suggests it's a screenshot, graphic, or UI capture
 */
function isPotentialGraphicByName(file: File): boolean {
  const name = file.name.toLowerCase();
  const graphicKeywords = [
    'screenshot',
    'screen_shot',
    'screen-shot',
    'screen shot',
    'capture',
    'snip',
    'diagram',
    'chart',
    'slide',
    'graph',
    'drawing',
    'vector',
    'scan',
    'receipt',
    'timetable',
    'schedule',
    'syllabus',
  ];
  return graphicKeywords.some(kw => name.includes(kw));
}

/**
 * Analyses canvas pixels to detect whether the image has few distinct colors
 * (typical of screenshots, slides, diagrams, text documents) or photographic content
 */
function isGraphicOrTextHeavy(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    // Sample a maximum of 400 pixels across the image
    const sampleCols = 20;
    const sampleRows = 20;
    const stepX = Math.max(1, Math.floor(width / sampleCols));
    const stepY = Math.max(1, Math.floor(height / sampleRows));

    const colorSet = new Set<string>();
    let transparentCount = 0;
    let highContrastEdges = 0;
    let prevLuminance: number | null = null;

    // Small sampling canvas for speed and memory efficiency
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sampleCols;
    sampleCanvas.height = sampleRows;
    const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sCtx) return false;

    sCtx.drawImage(ctx.canvas, 0, 0, sampleCols, sampleRows);
    const imgData = sCtx.getImageData(0, 0, sampleCols, sampleRows).data;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a < 240) {
        transparentCount++;
      }

      // Quantize colors to check palette diversity
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      colorSet.add(`${qr},${qg},${qb}`);

      // Relative luminance for text/edge contrast detection
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (prevLuminance !== null && Math.abs(lum - prevLuminance) > 85) {
        highContrastEdges++;
      }
      prevLuminance = lum;
    }

    // Has significant transparency -> keep crisp graphic quality
    if (transparentCount > 10) return true;

    // Very low color variety (less than 35 distinct quantized colors) -> graphic / text / illustration
    if (colorSet.size < 40) return true;

    // High proportion of stark contrast edges with modest palette -> document / slide
    if (highContrastEdges > 45 && colorSet.size < 90) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Safely loads image source with EXIF orientation awareness
 */
async function loadImageElement(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  // Prefer createImageBitmap with imageOrientation: 'from-image' for hardware-accelerated,
  // off-thread decoding with correct EXIF orientation
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => {
          try {
            bitmap.close();
          } catch {
            // Ignore close error
          }
        },
      };
    } catch {
      // Fall through to HTMLImageElement fallback
    }
  }

  // Fallback to HTMLImageElement
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}

/**
 * Converts canvas contents to Blob with given MIME type and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => resolve(blob),
        type,
        quality
      );
    } catch {
      resolve(null);
    }
  });
}

/**
 * Calculates target dimensions preserving aspect ratio, never upscaling
 */
export function calculateTargetDimensions(
  origW: number,
  origH: number,
  maxDimension: number
): { width: number; height: number; resized: boolean } {
  if (origW <= maxDimension && origH <= maxDimension) {
    return { width: origW, height: origH, resized: false };
  }

  let width: number;
  let height: number;

  if (origW >= origH) {
    width = maxDimension;
    height = Math.max(1, Math.round((origH * maxDimension) / origW));
  } else {
    height = maxDimension;
    width = Math.max(1, Math.round((origW * maxDimension) / origH));
  }

  return { width, height, resized: true };
}

/**
 * Smart Compress an Image File
 *
 * @param file The original image file
 * @param customOptions Optional configuration overrides
 * @returns CompressionResult containing the optimized file and before/after stats
 */
export async function smartCompressImage(
  file: File,
  customOptions: CompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...customOptions };

  const originalSize = file.size;
  const isWebPSupported = typeof document !== 'undefined' && (() => {
    try {
      const c = document.createElement('canvas');
      return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  })();

  // Quick fallback helper
  const createFallback = (w: number = 0, h: number = 0): CompressionResult => {
    const elapsed = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
    return {
      file,
      originalFile: file,
      originalSize,
      compressedSize: originalSize,
      originalWidth: w,
      originalHeight: h,
      width: w,
      height: h,
      format: (file.type as 'image/webp' | 'image/jpeg' | 'image/png') || 'image/jpeg',
      savedBytes: 0,
      savedPercent: 0,
      isCompressed: false,
      isGraphicOrScreenshot: false,
      compressionTimeMs: elapsed,
      previewUrl: URL.createObjectURL(file),
    };
  };

  // Allow non-image or empty files to pass through safely
  if (!file.type.startsWith('image/')) {
    return createFallback();
  }

  // Yield to browser main thread so UI updates / spinner shows smoothly
  await new Promise(resolve => setTimeout(resolve, 15));

  let loaded;
  try {
    loaded = await loadImageElement(file);
  } catch (err) {
    console.warn('[SmartCompressor] Could not load image:', err);
    return createFallback();
  }

  const { source, width: origW, height: origH, cleanup } = loaded;

  try {
    const { width: targetW, height: targetH, resized } = calculateTargetDimensions(
      origW,
      origH,
      opts.maxDimension
    );

    // If file is already small (e.g. < 120KB) and needs no resizing, keep original to avoid recompression artifacts
    if (!resized && originalSize <= opts.skipThresholdBytes) {
      cleanup();
      return {
        file,
        originalFile: file,
        originalSize,
        compressedSize: originalSize,
        originalWidth: origW,
        originalHeight: origH,
        width: origW,
        height: origH,
        format: (file.type as any) || 'image/jpeg',
        savedBytes: 0,
        savedPercent: 0,
        isCompressed: false,
        isGraphicOrScreenshot: isPotentialGraphicByName(file),
        compressionTimeMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime),
        previewUrl: URL.createObjectURL(file),
      };
    }

    // Set up high quality canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: true });

    if (!ctx) {
      cleanup();
      return createFallback(origW, origH);
    }

    // Configure high quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the image
    ctx.drawImage(source, 0, 0, targetW, targetH);

    // Analyze image content: is it a screenshot, graphic, diagram, or text-heavy?
    const hasGraphicName = isPotentialGraphicByName(file);
    const isGraphicContent = hasGraphicName || (file.type === 'image/png' && isGraphicOrTextHeavy(ctx, targetW, targetH));

    // Determine target format and quality
    // Prefer WebP unless unsupported; for graphics use 0.94+ quality, for photos use 0.85
    let targetFormat = isWebPSupported ? 'image/webp' : 'image/jpeg';
    let targetQuality = isGraphicContent ? opts.graphicQuality : opts.quality;

    // Check if original PNG has transparency and WebP is not supported -> retain PNG
    if (!isWebPSupported && file.type === 'image/png') {
      targetFormat = 'image/png';
    }

    let blob = await canvasToBlob(canvas, targetFormat, targetQuality);

    // Fallback to JPEG or PNG if WebP conversion returned null
    if (!blob) {
      targetFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      blob = await canvasToBlob(canvas, targetFormat, targetQuality);
    }

    cleanup();

    if (!blob) {
      return createFallback(origW, origH);
    }

    // If compressed output is actually larger than original and we didn't resize, keep original
    if (blob.size >= originalSize && !resized) {
      return {
        file,
        originalFile: file,
        originalSize,
        compressedSize: originalSize,
        originalWidth: origW,
        originalHeight: origH,
        width: origW,
        height: origH,
        format: (file.type as any) || 'image/jpeg',
        savedBytes: 0,
        savedPercent: 0,
        isCompressed: false,
        isGraphicOrScreenshot: isGraphicContent,
        compressionTimeMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime),
        previewUrl: URL.createObjectURL(file),
      };
    }

    // Generate output file name with appropriate extension
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const extension = targetFormat === 'image/webp' ? '.webp' : targetFormat === 'image/png' ? '.png' : '.jpg';
    const outputFileName = `${baseName}${extension}`;

    const compressedFile = new File([blob], outputFileName, {
      type: targetFormat,
      lastModified: Date.now(),
    });

    const savedBytes = Math.max(0, originalSize - compressedFile.size);
    const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;
    const elapsed = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);

    return {
      file: compressedFile,
      originalFile: file,
      originalSize,
      compressedSize: compressedFile.size,
      originalWidth: origW,
      originalHeight: origH,
      width: targetW,
      height: targetH,
      format: targetFormat as 'image/webp' | 'image/jpeg' | 'image/png',
      savedBytes,
      savedPercent,
      isCompressed: compressedFile.size < originalSize || resized,
      isGraphicOrScreenshot: isGraphicContent,
      compressionTimeMs: elapsed,
      previewUrl: URL.createObjectURL(compressedFile),
    };
  } catch (err) {
    console.warn('[SmartCompressor] Compression failed, falling back to original:', err);
    cleanup();
    return createFallback(origW, origH);
  }
}
