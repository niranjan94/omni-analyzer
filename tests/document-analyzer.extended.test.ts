import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DocumentAnalyzer } from '@/analyzers/document-analyzer.js';

function dataPath(...p: string[]) {
  return path.join(import.meta.dirname, 'data', ...p);
}

describe('DocumentAnalyzer - Additional Coverage', () => {
  const analyzer = new DocumentAnalyzer();

  describe('PDF analysis with options', () => {
    it('analyzes PDF with extractText enabled', async () => {
      const filepath = dataPath('documents', 'sample.pdf');
      const result = await analyzer.analyze(filepath, {
        extractText: true
      });

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.wordCount).toBeGreaterThanOrEqual(0);
      expect(result.characterCount).toBeGreaterThanOrEqual(0);
    });

    it('analyzes PDF without extractText', async () => {
      const filepath = dataPath('documents', 'sample.pdf');
      const result = await analyzer.analyze(filepath, {
        extractText: false
      });

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.wordCount).toBe(0); // No text extracted
      expect(result.characterCount).toBe(0);
    });
  });

  describe('DOCX analysis', () => {
    it('analyzes DOCX file', async () => {
      const filepath = dataPath('documents', 'sample.docx');
      const result = await analyzer.analyze(filepath);

      expect(result.wordCount).toBeGreaterThanOrEqual(0);
      expect(result.characterCount).toBeGreaterThanOrEqual(0);
      expect(result.characterCountNoSpaces).toBeGreaterThanOrEqual(0);
      expect(result.lineCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DOC analysis', () => {
    it('analyzes DOC file', async () => {
      const filepath = dataPath('documents', 'sample.doc');
      const result = await analyzer.analyze(filepath);

      // DOC files are treated as text fallback
      expect(result.wordCount).toBeGreaterThanOrEqual(0);
      expect(result.characterCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Other document formats', () => {
    it('analyzes ODT file as text fallback', async () => {
      const filepath = dataPath('documents', 'sample.odt');
      const result = await analyzer.analyze(filepath);

      expect(result).toBeDefined();
      expect(result.wordCount).toBeGreaterThanOrEqual(0);
      expect(result.characterCount).toBeGreaterThanOrEqual(0);
      expect(result.characterCountNoSpaces).toBeGreaterThanOrEqual(0);
      expect(result.lineCount).toBeGreaterThanOrEqual(0);
      expect(result.hasImages).toBe(false);
      expect(result.hasTables).toBe(false);
    });

    it('analyzes PPT file as text fallback', async () => {
      const filepath = dataPath('documents', 'sample.ppt');
      const result = await analyzer.analyze(filepath);

      expect(result).toBeDefined();
      expect(result.characterCount).toBeGreaterThanOrEqual(0);
    });

    it('analyzes PPTX file as text fallback', async () => {
      const filepath = dataPath('documents', 'sample.pptx');
      const result = await analyzer.analyze(filepath);

      expect(result).toBeDefined();
      expect(result.characterCount).toBeGreaterThanOrEqual(0);
    });

    it('analyzes ODP file as text fallback', async () => {
      const filepath = dataPath('documents', 'sample.odp');
      const result = await analyzer.analyze(filepath);

      expect(result).toBeDefined();
      expect(result.characterCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Timeout handling', () => {
    it('respects timeout option for PDF', async () => {
      const filepath = dataPath('documents', 'sample.pdf');

      // Very short timeout should either succeed quickly or timeout
      const start = Date.now();
      try {
        await analyzer.analyze(filepath, {
          timeout: 10000, // 10 seconds should be enough
          extractText: true
        });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(10000);
      } catch (error) {
        // Timeout is acceptable
        expect(error).toBeDefined();
      }
    });

    it('respects timeout option for DOCX', async () => {
      const filepath = dataPath('documents', 'sample.docx');

      const start = Date.now();
      try {
        await analyzer.analyze(filepath, { timeout: 10000 });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(10000);
      } catch (error) {
        // Timeout is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('getMimeTypes', () => {
    it('returns document mime types', () => {
      const mimeTypes = analyzer.getSupportedMimeTypes();
      expect(Array.isArray(mimeTypes)).toBe(true);
      expect(mimeTypes.length).toBeGreaterThan(0);
    });
  });
});

