import { createHash } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { detectXml } from '@file-type/xml';
import { FileTypeParser } from 'file-type';
import { FILE_SIZE_UNITS } from '../constants.js';
import { type BaseFileMetadata, FileReadError } from '../types.js';

const fallbackMimeTypes: Record<string, string> = {
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  doc: 'application/msword',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
};

/**
 * Detects the MIME type of a file based on its filepath.
 *
 * @param filepath The path of the file whose MIME type is to be determined.
 * @return The detected MIME type as a string, or null if it could not be determined.
 */
export async function detectMimeType(filepath: string): Promise<string | null> {
  const extension = getFileExtension(filepath);
  const mimeFromExtension = fallbackMimeTypes[extension];
  if (mimeFromExtension) {
    return mimeFromExtension;
  }
  try {
    const fileTypeParser = new FileTypeParser({ customDetectors: [detectXml] });
    const res = await fileTypeParser.fromFile(filepath);
    return res?.mime || null;
  } catch {
    return null;
  }
}

/**
 * Calculates the hash of a given file using the specified algorithm.
 *
 * @param filePath The path of the file to hash.
 * @param algorithm The hashing algorithm to use. Defaults to 'sha512'.
 * @return A promise that resolves to the hexadecimal representation of the file hash.
 */
async function calculateFileHash(
  filePath: string,
  algorithm: string = 'sha512',
): Promise<string> {
  const hash = createHash(algorithm);
  const input = createReadStream(filePath);
  await pipeline(input, hash);
  return hash.digest('hex');
}

/**
 * Retrieves metadata information for a specified file.
 *
 * @param filepath The full path to the file whose metadata is to be retrieved.
 * @return A promise that resolves to an object containing metadata about the file, such as filename, filepath, size, sizeFormatted, extension, and mimeType.
 */
export async function getFileStats(
  filepath: string,
): Promise<BaseFileMetadata> {
  const stats = await fs.stat(filepath);
  const filename = path.basename(filepath);
  const extension = getFileExtension(filepath);
  return {
    filename,
    filepath,
    size: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    extension,
    hash: await calculateFileHash(filepath),
    mimeType: null,
  };
}

/**
 * Converts a file size in bytes to a human-readable string representation.
 *
 * @param bytes The file size in bytes.
 * @return A formatted string representing the file size with appropriate units.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / k ** i;
  const unit = FILE_SIZE_UNITS[i] || 'B';
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${unit}`;
}

/**
 * Validates whether the provided file path exists and is a file.
 *
 * @param filepath - The path of the file to be validated.
 * @return Resolves if the file exists and is valid, otherwise throws an error.
 */
export async function validateFilePath(filepath: string): Promise<void> {
  await fs.access(filepath);
  const stats = await fs.stat(filepath);
  if (!stats.isFile()) {
    throw new FileReadError('Path is not a file');
  }
}

/**
 * Extracts the file extension from a given file path.
 *
 * @param filepath - The file path from which to extract the extension.
 * @return The file extension as a string, converted to lowercase. If there is no extension, an empty string is returned.
 */
export function getFileExtension(filepath: string): string {
  return path.extname(filepath).replace(/^\./, '').toLowerCase();
}

/**
 * Checks if the given file size is valid by comparing it to a maximum allowed size.
 *
 * @param size The size of the file to validate.
 * @param maxSize The maximum allowable file size.
 * @return A boolean indicating whether the file size is valid.
 */
export function isFileSizeValid(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

/**
 * Formats a duration in seconds into a string in HH:MM:SS format.
 *
 * @param seconds The total duration in seconds to be formatted.
 * @return A string representing the duration in HH:MM:SS format.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const hh = String(hrs).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Calculates the aspect ratio of a given width and height.
 *
 * @param width The width of the object.
 * @param height The height of the object.
 * @return The aspect ratio as a string in the format "width:height".
 */
export function calculateAspectRatio(width: number, height: number): string {
  if (width === 0 || height === 0) return '0:0';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(width, height);
  return `${Math.round(width / g)}:${Math.round(height / g)}`;
}
