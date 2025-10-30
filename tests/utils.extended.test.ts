import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { withTimeout } from '@/utils/async-utils.js';
import {
  calculateAspectRatio,
  detectMimeType,
  formatDuration,
  formatFileSize,
  getFileExtension,
  getFileStats,
  isFileSizeValid,
  validateFilePath,
} from '@/utils/file-utils.js';
import { AnalysisTimeoutError, FileReadError } from '@/types.js';

function dataPath(...p: string[]) {
  return path.join(import.meta.dirname, 'data', ...p);
}

describe('Utils Coverage', () => {
  describe('withTimeout', () => {
    it('resolves promise within timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('rejects with timeout error when promise takes too long', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 1000));

      await expect(withTimeout(slowPromise, 10)).rejects.toThrow(
        AnalysisTimeoutError,
      );
    });

    it('clears timeout when promise resolves', async () => {
      const promise = Promise.resolve('done');
      const result = await withTimeout(promise, 5000);
      expect(result).toBe('done');
    });

    it('handles rejected promises correctly', async () => {
      const promise = Promise.reject(new Error('test error'));

      await expect(withTimeout(promise, 1000)).rejects.toThrow('test error');
    });
  });

  describe('formatFileSize', () => {
    it('formats zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(5242880)).toBe('5.00 MB');
    });

    it('formats gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
    });

    it('formats with appropriate precision', () => {
      expect(formatFileSize(1)).toBe('1.00 B');
      expect(formatFileSize(10)).toBe('10.0 B');
      expect(formatFileSize(100)).toBe('100 B');
    });
  });

  describe('formatDuration', () => {
    it('formats zero seconds', () => {
      expect(formatDuration(0)).toBe('00:00:00');
    });

    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('00:00:45');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(125)).toBe('00:02:05');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3665)).toBe('01:01:05');
    });

    it('formats multiple hours', () => {
      expect(formatDuration(7325)).toBe('02:02:05');
    });

    it('pads single digits with zeros', () => {
      expect(formatDuration(3)).toBe('00:00:03');
      expect(formatDuration(63)).toBe('00:01:03');
    });
  });

  describe('calculateAspectRatio', () => {
    it('calculates standard aspect ratios', () => {
      expect(calculateAspectRatio(1920, 1080)).toBe('16:9');
      expect(calculateAspectRatio(1280, 720)).toBe('16:9');
      expect(calculateAspectRatio(1024, 768)).toBe('4:3');
    });

    it('calculates square aspect ratio', () => {
      expect(calculateAspectRatio(100, 100)).toBe('1:1');
    });

    it('handles zero dimensions', () => {
      expect(calculateAspectRatio(0, 0)).toBe('0:0');
      expect(calculateAspectRatio(100, 0)).toBe('0:0');
      expect(calculateAspectRatio(0, 100)).toBe('0:0');
    });

    it('simplifies ratios correctly', () => {
      expect(calculateAspectRatio(200, 100)).toBe('2:1');
      expect(calculateAspectRatio(300, 150)).toBe('2:1');
    });
  });

  describe('getFileExtension', () => {
    it('extracts file extension', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('/path/to/file.json')).toBe('json');
    });

    it('handles files without extension', () => {
      expect(getFileExtension('file')).toBe('');
      expect(getFileExtension('/path/to/file')).toBe('');
    });

    it('converts extension to lowercase', () => {
      expect(getFileExtension('FILE.TXT')).toBe('txt');
      expect(getFileExtension('Document.PDF')).toBe('pdf');
    });

    it('handles double extensions', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });
  });

  describe('isFileSizeValid', () => {
    it('returns true when size is within limit', () => {
      expect(isFileSizeValid(100, 1000)).toBe(true);
      expect(isFileSizeValid(1000, 1000)).toBe(true);
    });

    it('returns false when size exceeds limit', () => {
      expect(isFileSizeValid(1001, 1000)).toBe(false);
      expect(isFileSizeValid(5000, 1000)).toBe(false);
    });
  });

  describe('detectMimeType', () => {
    it('detects mime type for text files', async () => {
      const filepath = dataPath('text', 'sample.txt');
      const mimeType = await detectMimeType(filepath);
      expect(mimeType).toBeDefined();
    });

    it('detects mime type for images', async () => {
      const filepath = dataPath('images', 'sample.png');
      const mimeType = await detectMimeType(filepath);
      expect(mimeType).toContain('image');
    });

    it('uses fallback for CSV files', async () => {
      const filepath = dataPath('spreadsheets', 'sample.csv');
      const mimeType = await detectMimeType(filepath);
      expect(mimeType).toBe('text/csv');
    });

    it('uses fallback for XLS files', async () => {
      const filepath = dataPath('spreadsheets', 'sample.xls');
      const mimeType = await detectMimeType(filepath);
      expect(mimeType).toBe('application/vnd.ms-excel');
    });

    it('detects XML files', async () => {
      const filepath = dataPath('text', 'sample.xml');
      const mimeType = await detectMimeType(filepath);
      expect(mimeType).toBeDefined();
    });
  });

  describe('getFileStats', () => {
    it('gets complete file stats', async () => {
      const filepath = dataPath('text', 'sample.txt');
      const stats = await getFileStats(filepath);

      expect(stats.filename).toBe('sample.txt');
      expect(stats.filepath).toBe(filepath);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.sizeFormatted).toBeDefined();
      expect(stats.extension).toBe('txt');
      expect(stats.hash).toBeDefined();
      expect(stats.hash).toHaveLength(128); // sha512 hex length
      expect(stats.mimeType).toBeNull(); // Not set by getFileStats
    });

    it('calculates hash correctly', async () => {
      const filepath = dataPath('text', 'sample.txt');
      const stats1 = await getFileStats(filepath);
      const stats2 = await getFileStats(filepath);

      expect(stats1.hash).toBe(stats2.hash);
    });
  });

  describe('validateFilePath', () => {
    it('validates existing file', async () => {
      const filepath = dataPath('text', 'sample.txt');
      await expect(validateFilePath(filepath)).resolves.toBeUndefined();
    });

    it('throws error for non-existent file', async () => {
      const filepath = dataPath('non-existent-file.txt');
      await expect(validateFilePath(filepath)).rejects.toThrow();
    });

    it('throws FileReadError for directory', async () => {
      const dirpath = dataPath('text');
      await expect(validateFilePath(dirpath)).rejects.toThrow(FileReadError);
      await expect(validateFilePath(dirpath)).rejects.toThrow('Path is not a file');
    });
  });
});

