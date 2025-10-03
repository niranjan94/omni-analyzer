export interface BaseFileMetadata {
  filename: string;
  filepath: string;
  size: number;
  sizeFormatted: string;
  extension: string;
  mimeType: string | null;
}

export interface ImageMetadata {
  width: number;
  height: number;
  resolution: string; // "1920x1080"
  aspectRatio: string; // "16:9"
  colorSpace?: string;
  hasAlpha?: boolean;
  format: string; // "JPEG", "PNG", etc.
  bitDepth?: number;
}

export interface VideoMetadata {
  duration: number; // seconds
  durationFormatted: string; // "00:05:30"
  width: number;
  height: number;
  resolution: string;
  frameRate: number;
  codec: string;
  bitrate: number;
  audioCodec?: string;
  hasAudio: boolean;
  hasSubtitles: boolean;
}

export interface AudioMetadata {
  duration: number;
  durationFormatted: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
  artist?: string;
  title?: string;
  album?: string;
}

export interface SpreadsheetMetadata {
  rowCount: number;
  columnCount: number;
  columns: string[];
  sheetCount: number;
  sheets: SheetInfo[];
  hasFormulas: boolean;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
}

export interface DocumentMetadata {
  pageCount?: number;
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  lineCount?: number;
  paragraphCount?: number;
  language?: string;
  author?: string;
  title?: string;
  hasImages?: boolean;
  hasTables?: boolean;
}

export interface TextMetadata {
  lineCount: number;
  wordCount: number;
  characterCount: number;
  encoding: string;
  language?: string;
  isEmpty: boolean;
}

export interface ArchiveMetadata {
  fileCount: number;
  uncompressedSize: number;
  compressionRatio: number;
  files: ArchiveFileEntry[];
  isEncrypted: boolean;
}

export interface ArchiveFileEntry {
  path: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
}

export interface FileAnalysisResult {
  base: BaseFileMetadata;
  specific:
    | ImageMetadata
    | VideoMetadata
    | AudioMetadata
    | SpreadsheetMetadata
    | DocumentMetadata
    | TextMetadata
    | ArchiveMetadata
    | Record<string, never>; // Empty object for unknown types
  analysisTime: number; // milliseconds
  error?: string;
}

export interface AnalyzerOptions {
  maxFileSize?: number; // Max file size to analyze (bytes)
  timeout?: number; // Analysis timeout (ms)
  skipContent?: boolean; // Only get basic metadata
  sampleSize?: number; // For CSV/text files, how many rows to sample
  extractText?: boolean; // For documents, extract full text
  deepAnalysis?: boolean; // More thorough but slower analysis;
  failSilent?: boolean; // Don't throw errors for unsupported types'
}

export interface StreamAnalyzerOptions {
  chunkSize?: number; // For stream processing
  maxSampleRows?: number; // For CSV/spreadsheets
}

export abstract class BaseAnalyzer {
  abstract analyze(
    filepath: string,
    options: AnalyzerOptions,
  ): Promise<
    | ImageMetadata
    | VideoMetadata
    | AudioMetadata
    | SpreadsheetMetadata
    | DocumentMetadata
    | TextMetadata
    | ArchiveMetadata
    | Record<string, never>
  >;

  abstract getSupportedMimeTypes(): string[];
}

export class FileAnalyzerError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'FileAnalyzerError';
  }
}

export class FileSizeLimitError extends FileAnalyzerError {
  constructor(size: number, limit: number) {
    super(`File size ${size} exceeds limit ${limit}`, 'FILE_SIZE_LIMIT');
  }
}

export class FileReadError extends FileAnalyzerError {
  constructor(message: string) {
    super(message, 'FILE_READ');
  }
}

export class UnsupportedFileTypeError extends FileAnalyzerError {
  constructor(mimeType: string) {
    super(`Unsupported file type: ${mimeType}`, 'UNSUPPORTED_TYPE');
  }
}

export class AnalysisTimeoutError extends FileAnalyzerError {
  constructor(timeout: number) {
    super(`Analysis timeout after ${timeout}ms`, 'TIMEOUT');
  }
}
