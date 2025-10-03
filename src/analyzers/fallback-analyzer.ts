import { BaseAnalyzer } from './base-analyzer.js';

/**
 * The FallbackAnalyzer class extends the BaseAnalyzer and provides methods
 * for analyzing data and retrieving supported MIME types. It serves as a
 * fallback implementation.
 */
export class FallbackAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes the input data and performs specific operations.
   *
   * @return A promise that resolves to an empty record.
   */
  async analyze(): Promise<Record<string, never>> {
    return {};
  }

  /**
   * Retrieves the list of supported MIME types.
   *
   * @return An array of strings representing supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
    return ['*/*'];
  }
}
