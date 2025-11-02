import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api.js';
import { withTimeout } from '@/utils/async-utils.js';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, DocumentMetadata } from '../types.js';
import { BaseAnalyzer } from './base-analyzer.js';

/**
 * Counts the number of words in a given string.
 *
 * @param text The input string to count words from.
 * @return The number of words found in the input string.
 */
function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

/**
 * Extracts text from a PDF document with better layout by grouping text items
 * into lines based on their Y position and sorting them by their X position.
 * This method ensures a more human-readable layout of the extracted text.
 *
 * @param pdf The PDF document proxy object to extract text from.
 * @return A promise that resolves to a string containing the extracted text,
 *         organized with improved layout resembling the original document structure.
 */
async function extractTextWithBetterLayout(pdf: PDFDocumentProxy) {
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items by Y position (lines)
    const lines: Record<string, TextItem[]> = {};

    (textContent.items as TextItem[]).forEach((item: TextItem) => {
      if (!item.transform) return;
      const y = Math.round(item.transform[5]).toFixed(0);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item);
    });

    // Sort lines by Y (descending - PDF coords are bottom-up)
    const sortedYs = Object.keys(lines).sort((a, b) => Number(b) - Number(a));

    for (const y of sortedYs) {
      // Sort items in line by X position
      const lineItems = lines[y].sort(
        (a, b) => a.transform[4] - b.transform[4],
      );

      let lineText = '';
      let lastX = null;

      for (const item of lineItems) {
        const x = item.transform[4];

        // Add space if there's a gap
        if (lastX !== null) {
          const gap = x - lastX;
          if (gap > 10) lineText += ' '; // Adjust threshold as needed
        }

        lineText += item.str;
        lastX = x + item.width;
      }

      fullText += `${lineText}\n`;
    }

    fullText += '\n'; // Page break
  }

  return fullText;
}

/**
 * A class for analyzing documents and extracting metadata, such as word count, character count, line count, and other relevant statistics.
 * Supports analysis for various file types including PDF, Word documents, and plain text files.
 * The class also allows configuration of analysis behavior through optional parameters.
 * Extends the functionality of the `BaseAnalyzer` class.
 */
export class DocumentAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes the given file and extracts metadata such as word count, character count, line count, etc.
   * Supports PDF, DOCX, and text files.
   *
   * @param filepath - The path to the file to be analyzed.
   * @param options - Optional configuration options for analyzing the file.
   * @return A promise that resolves to the document metadata extracted from the file.
   */
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
    const data = await withTimeout(
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

  /**
   * Analyzes a PDF file and extracts metadata, text statistics, and other useful information.
   *
   * @param filepath - The file path to the PDF document to be analyzed.
   * @param opts - Configuration options for the analysis process, including timeout and text extraction settings.
   * @return An object containing metadata and statistics from the PDF file, such as page count, word count, character count, author, title, and more.
   */
  private async analyzePdf(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<DocumentMetadata> {
    const data: PDFDocumentProxy = await withTimeout(
      pdfjsLib.getDocument(filepath).promise,
      opts.timeout,
    );

    const text: string = await extractTextWithBetterLayout(data);
    const words = text ? countWords(text) : 0;
    const chars = text.length;
    const noSpaces = text.replace(/\s+/g, '').length;

    const { metadata, info } = await data.getMetadata();

    return {
      pageCount: data.numPages,
      wordCount: words,
      characterCount: chars,
      characterCountNoSpaces: noSpaces,
      lineCount: undefined,
      paragraphCount: undefined,
      text: opts.extractData ? text : undefined,
      author:
        metadata?.get('Author') ||
        (info as any)?.Author ||
        (info as any)?.Creator ||
        undefined,
      title: metadata?.get('Title') || (info as any)?.Title || undefined,
      hasImages: Boolean(metadata?.get('Image') || false),
      hasTables: false,
    };
  }

  /**
   * Analyzes a word file and extracts metadata such as word count, character count, and line count.
   *
   * @param filepath The file path of the word document to be analyzed.
   * @param opts An options object containing necessary settings for the analyzer.
   * @return A promise that resolves to an object containing the analysis results. It includes word count, character count,
   *         character count excluding spaces, line count, and other metadata.
   */
  private async analyzeWord(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<DocumentMetadata> {
    const res = await withTimeout(
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
      text: opts.extractData ? text : undefined,
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

  /**
   * Retrieves a list of supported MIME types.
   *
   * @return An array of strings representing the MIME types supported by the system.
   */
  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.DOCUMENT as unknown as string[];
  }
}
