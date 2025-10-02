import path from 'node:path';
import sharp from 'sharp';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, ImageMetadata } from '../types.js';
import { calculateAspectRatio } from '../utils/file-utils.js';
import { BaseAnalyzer } from './base-analyzer.js';

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

export class ImageAnalyzer extends BaseAnalyzer {
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<ImageMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

    const img = sharp(filepath, { sequentialRead: true });
    const md = await this.withTimeout(img.metadata(), merged.timeout);
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

  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.IMAGE as unknown as string[];
  }
}
