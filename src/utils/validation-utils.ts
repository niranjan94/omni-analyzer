import fs from 'node:fs';
import path from 'node:path';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions } from '../types.js';

export function validateFilePath(filepath: string): void {
  const clean = sanitizeFilePath(filepath);
  if (!fs.existsSync(clean)) {
    throw new Error(`File does not exist: ${filepath}`);
  }
  const stat = fs.statSync(clean);
  if (!stat.isFile()) {
    throw new Error(`Not a file: ${filepath}`);
  }
}

export function validateOptions(options: Partial<AnalyzerOptions>): void {
  if (options.maxFileSize != null && options.maxFileSize <= 0) {
    throw new Error('maxFileSize must be > 0');
  }
  if (options.timeout != null && options.timeout <= 0) {
    throw new Error('timeout must be > 0');
  }
  if (options.sampleSize != null && options.sampleSize <= 0) {
    throw new Error('sampleSize must be > 0');
  }
}

export function sanitizeFilePath(filepath: string): string {
  // Basic normalization to avoid oddities; real impl might prevent path traversal
  return path.normalize(filepath);
}

export function isSupportedMimeType(mimeType: string): boolean {
  const all = [
    ...MIME_CATEGORIES.IMAGE,
    ...MIME_CATEGORIES.VIDEO,
    ...MIME_CATEGORIES.AUDIO,
    ...MIME_CATEGORIES.DOCUMENT,
    ...MIME_CATEGORIES.SPREADSHEET,
    ...MIME_CATEGORIES.ARCHIVE,
    ...MIME_CATEGORIES.TEXT,
  ];
  return all.includes(mimeType as (typeof all)[number]);
}
