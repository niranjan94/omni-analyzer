import type { AnalyzerOptions } from './types.js';

export const MIME_CATEGORIES = {
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
  ],
  VIDEO: [
    'video/vnd.avi',
    'video/x-flv',
    'video/matroska',
    'video/quicktime',
    'video/mp4',
    'video/MP1S',
    'application/x-shockwave-flash',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/mpeg',
  ],
  AUDIO: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
    'audio/x-m4a',
  ],
  DOCUMENT: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/msword',
    'application/rtf',
    'application/vnd.ms-powerpoint',
  ],
  SPREADSHEET: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/x-cfb',
    'text/csv',
  ],
  ARCHIVE: [
    'application/zip',
    'application/x-tar',
    'application/gzip',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
  ],
  TEXT: [
    'text/plain',
    'text/html',
    'text/css',
    'application/json',
    'application/xml',
    'text/markdown',
  ],
} as const;

export const DEFAULT_OPTIONS: Required<AnalyzerOptions> = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  timeout: 30000, // 30 seconds
  sampleSize: 1000, // rows
  extractData: false,
  failSilent: false,
};

export const STREAM_DEFAULTS = {
  chunkSize: 64 * 1024, // 64KB
  maxSampleRows: 1000,
};

export const SIZE_LIMITS = {
  TEXT_FULL_READ: 10 * 1024 * 1024, // 10MB - read fully into memory
  CSV_SAMPLE_SIZE: 1000, // rows
  EXCEL_SAMPLE_SIZE: 1000, // rows
  IMAGE_MAX_DIMENSION: 50000, // pixels
};

export const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
