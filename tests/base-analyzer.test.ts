import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BaseAnalyzer } from '@/analyzers/base-analyzer.js';
import { FileAnalyzerError } from '@/types.js';

class TestAnalyzer extends BaseAnalyzer {
  async analyze(_filepath: string): Promise<{ test: string }> {
    return { test: 'result' };
  }

  getSupportedMimeTypes(): string[] {
    return ['text/plain', 'application/json'];
  }
}

function dataPath(...p: string[]) {
  return path.join(import.meta.dirname, 'data', ...p);
}

describe('BaseAnalyzer', () => {
  it('creates instance with default options', () => {
    const analyzer = new TestAnalyzer();
    expect(analyzer).toBeInstanceOf(BaseAnalyzer);
  });

  it('creates instance with custom options', () => {
    const analyzer = new TestAnalyzer({ maxFileSize: 1000000, timeout: 5000 });
    expect(analyzer).toBeInstanceOf(BaseAnalyzer);
  });

  it('returns true for supported mime types', () => {
    const analyzer = new TestAnalyzer();
    expect(analyzer.canHandle('text/plain')).toBe(true);
    expect(analyzer.canHandle('application/json')).toBe(true);
  });

  it('returns false for unsupported mime types', () => {
    const analyzer = new TestAnalyzer();
    expect(analyzer.canHandle('image/png')).toBe(false);
    expect(analyzer.canHandle('video/mp4')).toBe(false);
  });

  it('validates a valid file', async () => {
    const analyzer = new TestAnalyzer();
    const filepath = dataPath('text', 'sample.txt');
    await expect(analyzer.validateFile(filepath)).resolves.toBeUndefined();
  });

  it('throws error for directory', async () => {
    const analyzer = new TestAnalyzer();
    const dirpath = dataPath('text');
    await expect(analyzer.validateFile(dirpath)).rejects.toThrow('Not a file');
  });

  it('throws error for non-existent file', async () => {
    const analyzer = new TestAnalyzer();
    const filepath = dataPath('non-existent-file.txt');
    await expect(analyzer.validateFile(filepath)).rejects.toThrow();
  });

  it('rethrows Error instances', () => {
    const analyzer = new TestAnalyzer();
    const error = new Error('Test error');
    expect(() => analyzer.handleError(error)).toThrow('Test error');
  });

  it('wraps unknown errors in FileAnalyzerError', () => {
    const analyzer = new TestAnalyzer();
    expect(() => analyzer.handleError('string error')).toThrow(
      FileAnalyzerError,
    );
    expect(() => analyzer.handleError('string error')).toThrow('Unknown error');
  });

  it('wraps null/undefined errors', () => {
    const analyzer = new TestAnalyzer();
    expect(() => analyzer.handleError(null)).toThrow(FileAnalyzerError);
    expect(() => analyzer.handleError(undefined)).toThrow(FileAnalyzerError);
  });
});
