import { createReadStream } from 'node:fs';
import readline from 'node:readline';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, TextMetadata } from '../types.js';
import { BaseAnalyzer } from './base-analyzer.js';

/**
 * Extends the functionality of BaseAnalyzer to provide analysis of text files.
 * Capable of processing and extracting metadata such as line count, word count,
 * character count, encoding, and empty file status from text files.
 */
export class TextAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes a given text file to obtain metadata such as line count, word count, character count, and encoding.
   *
   * @param filepath The path to the file to analyze.
   * @param options Optional configurations for the analysis process.
   * @return A promise that resolves to an object containing analyzed text metadata including line count, word count, character count, encoding, and a flag indicating if the file is empty.
   */
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<TextMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options };

    // Simple encoding guess based on BOM
    const stream = createReadStream(filepath, { start: 0, end: 3 });
    const chunks: Buffer[] = [];
    const encoding: string = await new Promise((resolve, reject) => {
      stream.on('data', (c) => chunks.push(Buffer.from(c)));
      stream.on('error', reject);
      stream.on('end', () => {
        const b = Buffer.concat(chunks);
        if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf)
          return resolve('utf-8');
        if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe)
          return resolve('utf-16le');
        if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff)
          return resolve('utf-16be');
        resolve('utf-8');
      });
    });

    let lineCount = 0;
    let wordCount = 0;
    let charCount = 0;

    const dataLines: string[] = [];

    const rl = readline.createInterface({
      input: createReadStream(filepath),
    });
    for await (const line of rl) {
      lineCount += 1;
      charCount += line.length + 1; // include newline
      // simple word split on whitespace
      wordCount += (line.trim().match(/\S+/g) || []).length;
      if (merged?.extractData) {
        dataLines.push(line);
      }
    }

    return {
      lineCount,
      wordCount,
      characterCount: charCount,
      encoding,
      isEmpty: lineCount === 0 && charCount === 0,
      text: merged?.extractData ? dataLines.join('\n') : undefined,
    };
  }

  /**
   * Retrieves the list of supported MIME types.
   *
   * @return An array of strings representing the supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.TEXT as unknown as string[];
  }
}
