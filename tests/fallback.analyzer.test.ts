import { describe, expect, it } from 'vitest';
import { FallbackAnalyzer } from '@/analyzers/fallback-analyzer.js';

describe('FallbackAnalyzer', () => {
  it('returns empty object for any file', async () => {
    const analyzer = new FallbackAnalyzer();
    const result = await analyzer.analyze();
    expect(result).toEqual({});
  });

  it('supports */* mime type', () => {
    const analyzer = new FallbackAnalyzer();
    const mimeTypes = analyzer.getSupportedMimeTypes();
    expect(mimeTypes).toEqual(['*/*']);
  });

  it('can handle any mime type', () => {
    const analyzer = new FallbackAnalyzer();
    expect(analyzer.canHandle('*/*')).toBe(true);
  });
});

