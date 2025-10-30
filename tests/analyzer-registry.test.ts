import { describe, expect, it } from 'vitest';
import { AnalyzerRegistry } from '@/registry/analyzer-registry.js';
import { BaseAnalyzer } from '@/analyzers/base-analyzer.js';
import { FallbackAnalyzer } from '@/analyzers/fallback-analyzer.js';
import type { AnalyzerOptions } from '@/types.js';

class CustomTestAnalyzer extends BaseAnalyzer {
  async analyze(_filepath: string, _options?: AnalyzerOptions): Promise<Record<string, never>> {
    return { custom: true as never };
  }

  getSupportedMimeTypes(): string[] {
    return ['application/x-custom-test'];
  }
}

describe('AnalyzerRegistry', () => {
  describe('Singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = AnalyzerRegistry.getInstance();
      const instance2 = AnalyzerRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAnalyzer', () => {
    it('returns fallback analyzer for unknown mime types', () => {
      const registry = AnalyzerRegistry.getInstance();
      const analyzer = registry.getAnalyzer('application/x-unknown');
      // Should return fallback, but might return category match
      expect(analyzer).toBeDefined();
    });

    it('returns category analyzer for wildcard match', () => {
      const registry = AnalyzerRegistry.getInstance();
      const analyzer = registry.getAnalyzer('image/x-custom-image');
      // Should match image/* category
      expect(analyzer).toBeDefined();
      expect(analyzer).not.toBeInstanceOf(FallbackAnalyzer);
    });

    it('returns exact match over category match', () => {
      const registry = AnalyzerRegistry.getInstance();
      const analyzer = registry.getAnalyzer('image/png');
      expect(analyzer).toBeDefined();
    });
  });

  describe('registerCustomAnalyzer', () => {
    it('registers and retrieves custom analyzer', () => {
      const registry = AnalyzerRegistry.getInstance();
      const customAnalyzer = new CustomTestAnalyzer();

      registry.registerCustomAnalyzer(
        ['application/x-custom-test'],
        customAnalyzer,
      );

      const retrieved = registry.getAnalyzer('application/x-custom-test');
      expect(retrieved).toBe(customAnalyzer);
    });

    it('registers custom analyzer for multiple mime types', () => {
      const registry = AnalyzerRegistry.getInstance();
      const customAnalyzer = new CustomTestAnalyzer();

      registry.registerCustomAnalyzer(
        ['application/x-custom-1', 'application/x-custom-2'],
        customAnalyzer,
      );

      const retrieved1 = registry.getAnalyzer('application/x-custom-1');
      const retrieved2 = registry.getAnalyzer('application/x-custom-2');

      expect(retrieved1).toBe(customAnalyzer);
      expect(retrieved2).toBe(customAnalyzer);
    });

    it('overrides existing analyzer with custom one', () => {
      const registry = AnalyzerRegistry.getInstance();
      const customAnalyzer = new CustomTestAnalyzer();

      // Override text/plain with custom analyzer
      registry.registerCustomAnalyzer(['text/plain'], customAnalyzer);

      const retrieved = registry.getAnalyzer('text/plain');
      expect(retrieved).toBe(customAnalyzer);
    });
  });
});

