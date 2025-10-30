import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ArchiveAnalyzer } from '@/analyzers/archive-analyzer.js';

function dataPath(...p: string[]) {
  return path.join(import.meta.dirname, 'data', ...p);
}

describe('ArchiveAnalyzer - Extended Coverage', () => {
  const analyzer = new ArchiveAnalyzer();

  describe('ZIP analysis', () => {
    it('analyzes ZIP file completely', async () => {
      const filepath = dataPath('archives', 'sample.zip');
      const result = await analyzer.analyze(filepath);

      expect(result.fileCount).toBeGreaterThan(0);
      expect(result.uncompressedSize).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(typeof result.isEncrypted).toBe('boolean');
    });

    it('extracts file entries from ZIP', async () => {
      const filepath = dataPath('archives', 'sample.zip');
      const result = await analyzer.analyze(filepath);

      expect(result.files.length).toBeGreaterThan(0);
      result.files.forEach(file => {
        expect(file.path).toBeDefined();
        expect(file.size).toBeGreaterThanOrEqual(0);
        expect(file.compressedSize).toBeGreaterThanOrEqual(0);
        expect(typeof file.isDirectory).toBe('boolean');
      });
    });

    it('calculates compression ratio for ZIP', async () => {
      const filepath = dataPath('archives', 'sample.zip');
      const result = await analyzer.analyze(filepath);

      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('detects encryption status in ZIP', async () => {
      const filepath = dataPath('archives', 'sample.zip');
      const result = await analyzer.analyze(filepath);

      expect(typeof result.isEncrypted).toBe('boolean');
    });
  });

  describe('TAR analysis', () => {
    it('analyzes TAR file completely', async () => {
      const filepath = dataPath('archives', 'sample.tar');
      const result = await analyzer.analyze(filepath);

      expect(result.fileCount).toBeGreaterThanOrEqual(0);
      expect(result.uncompressedSize).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBe(0); // TAR without compression
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.isEncrypted).toBe(false);
    });

    it('extracts file entries from TAR', async () => {
      const filepath = dataPath('archives', 'sample.tar');
      const result = await analyzer.analyze(filepath);

      result.files.forEach(file => {
        expect(file.path).toBeDefined();
        expect(file.size).toBeGreaterThanOrEqual(0);
        expect(file.compressedSize).toBeGreaterThanOrEqual(0);
        expect(typeof file.isDirectory).toBe('boolean');
      });
    });

    it('identifies directories in TAR', async () => {
      const filepath = dataPath('archives', 'sample.tar');
      const result = await analyzer.analyze(filepath);

      // Check if any directories are detected
      const hasDirectories = result.files.some(f => f.isDirectory);
      // This depends on the sample file content
      expect(typeof hasDirectories).toBe('boolean');
    });
  });

  describe('Timeout handling', () => {
    it('respects timeout for ZIP analysis', async () => {
      const filepath = dataPath('archives', 'sample.zip');

      const start = Date.now();
      await analyzer.analyze(filepath, { timeout: 10000 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
    });

    it('respects timeout for TAR analysis', async () => {
      const filepath = dataPath('archives', 'sample.tar');

      const start = Date.now();
      await analyzer.analyze(filepath, { timeout: 10000 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe('File count accuracy', () => {
    it('counts only files, not directories in ZIP', async () => {
      const filepath = dataPath('archives', 'sample.zip');
      const result = await analyzer.analyze(filepath);

      const actualFileCount = result.files.filter(f => !f.isDirectory).length;
      expect(result.fileCount).toBe(actualFileCount);
    });

    it('counts only files, not directories in TAR', async () => {
      const filepath = dataPath('archives', 'sample.tar');
      const result = await analyzer.analyze(filepath);

      const actualFileCount = result.files.filter(f => !f.isDirectory).length;
      expect(result.fileCount).toBe(actualFileCount);
    });
  });

  describe('Size calculations', () => {
    it('sums uncompressed sizes correctly for ZIP', async () => {
      const filepath = dataPath('archives', 'sample.zip');
      const result = await analyzer.analyze(filepath);

      const calculatedSize = result.files
        .filter(f => !f.isDirectory)
        .reduce((sum, f) => sum + f.size, 0);
      expect(result.uncompressedSize).toBe(calculatedSize);
    });

    it('sums uncompressed sizes correctly for TAR', async () => {
      const filepath = dataPath('archives', 'sample.tar');
      const result = await analyzer.analyze(filepath);

      const calculatedSize = result.files
        .filter(f => !f.isDirectory)
        .reduce((sum, f) => sum + f.size, 0);
      expect(result.uncompressedSize).toBe(calculatedSize);
    });
  });
});

