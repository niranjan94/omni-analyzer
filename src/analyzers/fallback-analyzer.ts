import { BaseAnalyzer } from './base-analyzer.js';

export class FallbackAnalyzer extends BaseAnalyzer {
  async analyze(): Promise<Record<string, never>> {
    return {};
  }

  getSupportedMimeTypes(): string[] {
    return ['*/*'];
  }
}
