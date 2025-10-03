import path from 'node:path';
import sharp from 'sharp';
import { withTimeout } from '@/utils/async-utils.js';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, ImageMetadata } from '../types.js';
import { calculateAspectRatio } from '../utils/file-utils.js';
import { BaseAnalyzer } from './base-analyzer.js';

/**
 * Determines the file format based on a given file extension.
 *
 * @param ext The file extension to infer the format from.
 * @return The inferred file format as a string, or the uppercased extension if no match is found.
 */
function inferFormatFromExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'JPEG',
    jpeg: 'JPEG',
    png: 'PNG',
    gif: 'GIF',
    webp: 'WEBP',
    bmp: 'BMP',
    tiff: 'TIFF',
    tif: 'TIFF',
    svg: 'SVG',
    heic: 'HEIC',
    heif: 'HEIF',
  };
  return map[ext.toLowerCase()] || ext.toUpperCase();
}

/**
 * A class for analyzing image files and extracting metadata such as dimensions, format, and color space.
 */
export class ImageAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes the specified image file and extracts metadata such as dimensions, format, and color space.
   *
   * @param filepath - The path to the image file to be analyzed.
   * @param options - Optional configuration options for the analyzer.
   * @return A promise that resolves with the extracted image metadata.
   */
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<ImageMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

    const img = sharp(filepath, { sequentialRead: true });
    const md = await withTimeout(img.metadata(), merged.timeout);
    const width = Number(md.width || 0);
    const height = Number(md.height || 0);
    const format = (
      md.format || inferFormatFromExt(path.extname(filepath).replace(/^\./, ''))
    )
      .toString()
      .toUpperCase();
    const resolution = `${width}x${height}`;
    const aspectRatio = calculateAspectRatio(width, height);
    return {
      width,
      height,
      resolution,
      aspectRatio,
      colorSpace: md.space || undefined,
      hasAlpha: md.hasAlpha ?? undefined,
      format,
      bitDepth: md.depth ? Number(md.depth) : undefined,
    };
  }

  /**
   * Retrieves the list of supported MIME types.
   *
   * @return An array of strings representing the supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.IMAGE as unknown as string[];
  }
}
