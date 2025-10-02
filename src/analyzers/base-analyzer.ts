import { promises as fs } from 'node:fs';
import { DEFAULT_OPTIONS } from '../constants.js';
import type { AnalyzerOptions } from '../types.js';

export abstract class BaseAnalyzer {
  protected options: Required<AnalyzerOptions>;

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<AnalyzerOptions>;
  }

  abstract analyze(filepath: string, options?: AnalyzerOptions): Promise<any>;

  abstract getSupportedMimeTypes(): string[];

  canHandle(mimeType: string): boolean {
    return this.getSupportedMimeTypes().includes(mimeType);
  }

  protected async validateFile(filepath: string): Promise<void> {
    const stats = await fs.stat(filepath);
    if (!stats.isFile()) throw new Error('Not a file');
  }

  protected async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    return await Promise.race([
      promise.finally(() => timer && clearTimeout(timer)),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timeout after ${timeout}ms`)),
          timeout,
        );
      }),
    ]);
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) throw error;
    throw new Error('Unknown error');
  }
}
