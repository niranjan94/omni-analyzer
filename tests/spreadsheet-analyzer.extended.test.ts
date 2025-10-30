import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SpreadsheetAnalyzer } from '@/analyzers/spreadsheet-analyzer.js';

function dataPath(...p: string[]) {
  return path.join(import.meta.dirname, 'data', ...p);
}

describe('SpreadsheetAnalyzer - Options Coverage', () => {
  const analyzer = new SpreadsheetAnalyzer();

  describe('CSV analysis', () => {
    it('analyzes CSV with full content', async () => {
      const filepath = dataPath('spreadsheets', 'sample.csv');
      const result = await analyzer.analyze(filepath, { skipContent: false });

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.columnCount).toBeGreaterThan(0);
      expect(result.columns).toBeDefined();
      expect(result.sheetCount).toBe(1);
      expect(result.sheets).toHaveLength(1);
      expect(result.sheets[0].name).toBe('CSV');
      expect(result.hasFormulas).toBe(false);
    });
  });

  describe('XLS analysis', () => {
    it('analyzes XLS file', async () => {
      const filepath = dataPath('spreadsheets', 'sample.xls');
      const result = await analyzer.analyze(filepath);

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.columnCount).toBeGreaterThan(0);
      expect(result.sheetCount).toBeGreaterThanOrEqual(1);
      expect(result.sheets).toBeDefined();
      expect(result.sheets.length).toBeGreaterThan(0);
    });

    it('analyzes XLS with skipContent and sample size', async () => {
      const filepath = dataPath('spreadsheets', 'sample.xls');
      const result = await analyzer.analyze(filepath, {
        skipContent: true,
        sampleSize: 10
      });

      expect(result.columnCount).toBeGreaterThan(0);
      expect(result.sheetCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('XLSX analysis', () => {
    it('analyzes XLSX file', async () => {
      const filepath = dataPath('spreadsheets', 'sample.xlsx');
      const result = await analyzer.analyze(filepath);

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.columnCount).toBeGreaterThan(0);
      expect(result.sheetCount).toBeGreaterThanOrEqual(1);
      expect(result.sheets).toBeDefined();
      expect(result.sheets.length).toBeGreaterThan(0);
      expect(result.sheets[0].name).toBeDefined();
      expect(result.sheets[0].rowCount).toBeGreaterThan(0);
    });

    it('analyzes XLSX with skipContent and sample size', async () => {
      const filepath = dataPath('spreadsheets', 'sample.xlsx');
      const result = await analyzer.analyze(filepath, {
        skipContent: true,
        sampleSize: 10
      });

      expect(result.columnCount).toBeGreaterThan(0);
      expect(result.sheetCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ODS analysis', () => {
    it('analyzes ODS file', async () => {
      const filepath = dataPath('spreadsheets', 'sample.ods');
      const result = await analyzer.analyze(filepath);

      expect(result.rowCount).toBeGreaterThanOrEqual(0);
      expect(result.columnCount).toBeGreaterThanOrEqual(0);
      expect(result.sheetCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Timeout handling', () => {
    it('respects timeout for CSV analysis', async () => {
      const filepath = dataPath('spreadsheets', 'sample.csv');

      const start = Date.now();
      await analyzer.analyze(filepath, { timeout: 10000 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
    });

    it('respects timeout for XLSX analysis', async () => {
      const filepath = dataPath('spreadsheets', 'sample.xlsx');

      const start = Date.now();
      await analyzer.analyze(filepath, { timeout: 10000 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe('Multiple sheets handling', () => {
    it('extracts metadata for all sheets in workbook', async () => {
      const filepath = dataPath('spreadsheets', 'sample.xlsx');
      const result = await analyzer.analyze(filepath);

      expect(result.sheets.length).toBe(result.sheetCount);
      result.sheets.forEach(sheet => {
        expect(sheet.name).toBeDefined();
        expect(sheet.rowCount).toBeGreaterThanOrEqual(0);
        expect(sheet.columnCount).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(sheet.columns)).toBe(true);
      });
    });
  });
});

