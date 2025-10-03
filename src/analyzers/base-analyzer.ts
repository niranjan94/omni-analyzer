import { promises as fs } from 'node:fs';
import { DEFAULT_OPTIONS } from '../constants.js';
import { type AnalyzerOptions, FileAnalyzerError } from '../types.js';

/**
 * Abstract base class for performing analysis on files. This class provides
 * a foundation for implementing specific file analyzers with shared utilities
 * such as validation, timeout handling, and error management.
 */
export abstract class BaseAnalyzer {
  protected options: Required<AnalyzerOptions>;

  /**
   * Creates an instance of the class with the provided configuration options.
   *
   * @param options - Configuration options to customize the behavior of the instance. Defaults to an empty object.
   * @return A new class instance with merged default and provided options.
   */
  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<AnalyzerOptions>;
  }

  /**
   * Performs analysis on the given file path and returns the results based on the specified options.
   *
   * @param filepath The path to the file to be analyzed.
   * @param options Optional parameters for configuring the analysis process.
   * @return A promise that resolves with the analysis result.
   */
  abstract analyze(filepath: string, options?: AnalyzerOptions): Promise<any>;

  /**
   * Retrieves the list of MIME types supported by the implementation.
   *
   * @return A list of supported MIME types as strings.
   */
  abstract getSupportedMimeTypes(): string[];

  /**
   * Determines whether the provided MIME type can be handled.
   *
   * @param mimeType The MIME type to check.
   * @return Returns true if the MIME type is supported, otherwise false.
   */
  canHandle(mimeType: string): boolean {
    return this.getSupportedMimeTypes().includes(mimeType);
  }

  /**
   * Validates whether the given filepath points to a valid file.
   *
   * @param filepath The path to the file that needs to be validated.
   * @return A promise that resolves if the file is valid or rejects with an error if the validation fails.
   */
  protected async validateFile(filepath: string): Promise<void> {
    const stats = await fs.stat(filepath);
    if (!stats.isFile()) throw new Error('Not a file');
  }

  /**
   * Handles errors by throwing them if recognized, or throwing a new error for unknown cases.
   *
   * @param error The error encountered that needs to be processed. Can be of any type.
   * @return Never returns as it always throws an error.
   */
  protected handleError(error: unknown): never {
    if (error instanceof Error) throw error;
    throw new FileAnalyzerError('Unknown error', 'UNKNOWN_ERROR');
  }
}
