import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { pdf } from 'pdf-parse';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, DocumentMetadata } from '../types.js';
import { BaseAnalyzer } from './base-analyzer.js';

function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export class DocumentAnalyzer extends BaseAnalyzer {
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<DocumentMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

    const ext = path.extname(filepath).toLowerCase();
    if (ext === '.pdf') return this.analyzePdf(filepath, merged);
    if (ext === '.docx') return this.analyzeWord(filepath, merged);

    // Fallback: treat as text via fs if needed
    const data = await this.withTimeout(
      fs.readFile(filepath, 'utf8').catch(() => ''),
      merged.timeout,
    );
    const words = countWords(data);
    const chars = data.length;
    const noSpaces = data.replace(/\s+/g, '').length;
    const lines = data ? data.split(/\r?\n/).length : 0;
    return {
      pageCount: undefined,
      wordCount: words,
      characterCount: chars,
      characterCountNoSpaces: noSpaces,
      lineCount: lines,
      paragraphCount: undefined,
      hasImages: false,
      hasTables: false,
    };
  }

  private async analyzePdf(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<DocumentMetadata> {
    const data = await this.withTimeout(
      pdf(await fs.readFile(filepath)),
      opts.timeout,
    );
    const text: string = opts.extractText ? data.text || '' : '';
    const words = text ? countWords(text) : 0;
    const chars = text.length;
    const noSpaces = text.replace(/\s+/g, '').length;

    return {
      pageCount: data.numpages ?? data.numrender ?? undefined,
      wordCount: words,
      characterCount: chars,
      characterCountNoSpaces: noSpaces,
      lineCount: undefined,
      paragraphCount: undefined,
      author: data.info?.Author || undefined,
      title: data.info?.Title || undefined,
      hasImages: Boolean(data.metadata?._metadata?.includes('Image') || false),
      hasTables: false,
    };
  }

  private async analyzeWord(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<DocumentMetadata> {
    const res = await this.withTimeout(
      mammoth.extractRawText({ path: filepath }),
      opts.timeout,
    );
    const text: string = res.value || '';
    const words = countWords(text);
    const chars = text.length;
    const noSpaces = text.replace(/\s+/g, '').length;
    const lines = text ? text.split(/\r?\n/).length : 0;

    return {
      wordCount: words,
      characterCount: chars,
      characterCountNoSpaces: noSpaces,
      lineCount: lines,
      pageCount: undefined,
      paragraphCount: undefined,
      author: undefined,
      title: undefined,
      hasImages: false,
      hasTables: false,
    };
  }

  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.DOCUMENT as unknown as string[];
  }
}
