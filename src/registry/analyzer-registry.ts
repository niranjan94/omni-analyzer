import { ArchiveAnalyzer } from '../analyzers/archive-analyzer.js';
import { AudioAnalyzer } from '../analyzers/audio-analyzer.js';
import { DocumentAnalyzer } from '../analyzers/document-analyzer.js';
import { FallbackAnalyzer } from '../analyzers/fallback-analyzer.js';
import { ImageAnalyzer } from '../analyzers/image-analyzer.js';
import { SpreadsheetAnalyzer } from '../analyzers/spreadsheet-analyzer.js';
import { TextAnalyzer } from '../analyzers/text-analyzer.js';
import { VideoAnalyzer } from '../analyzers/video-analyzer.js';
import { MIME_CATEGORIES } from '../constants.js';
import type { BaseAnalyzer as BaseAnalyzerType } from '../types.js';

/**
 * The `AnalyzerRegistry` class is responsible for managing and providing analyzers for specific MIME types.
 * It follows a singleton design pattern and maintains a registry of analyzers mapped to MIME types and broader MIME categories.
 */
export class AnalyzerRegistry {
  private static instance: AnalyzerRegistry;
  private analyzers: Map<string, BaseAnalyzerType>;
  private categoryMap: Map<string, BaseAnalyzerType>;
  private fallback: BaseAnalyzerType;

  /**
   * Initializes a new instance of the class.
   * The constructor sets up internal data structures,
   * registers necessary analyzers, and assigns a fallback analyzer.
   *
   * @return {void} No return value
   */
  private constructor() {
    this.analyzers = new Map();
    this.categoryMap = new Map();
    this.fallback = new FallbackAnalyzer();
    this.registerAnalyzers();
  }

  /**
   * Retrieves the singleton instance of the AnalyzerRegistry.
   * If the instance does not exist, it creates a new one.
   *
   * @return The single instance of AnalyzerRegistry.
   */
  static getInstance(): AnalyzerRegistry {
    if (!AnalyzerRegistry.instance) {
      AnalyzerRegistry.instance = new AnalyzerRegistry();
    }
    return AnalyzerRegistry.instance;
  }

  /**
   * Registers various analyzers for specific MIME types and MIME categories, mapping them for later use.
   * Analyzers are assigned to both exact MIME types and broader wildcard categories.
   *
   * @return {void} This method does not return a value.
   */
  private registerAnalyzers(): void {
    const image = new ImageAnalyzer();
    const text = new TextAnalyzer();
    const video = new VideoAnalyzer();
    const audio = new AudioAnalyzer();
    const sheet = new SpreadsheetAnalyzer();
    const doc = new DocumentAnalyzer();
    const arch = new ArchiveAnalyzer();

    // Map exact MIME types
    for (const m of MIME_CATEGORIES.IMAGE) this.analyzers.set(m, image);
    for (const m of MIME_CATEGORIES.TEXT) this.analyzers.set(m, text);
    for (const m of MIME_CATEGORIES.VIDEO) this.analyzers.set(m, video);
    for (const m of MIME_CATEGORIES.AUDIO) this.analyzers.set(m, audio);
    for (const m of MIME_CATEGORIES.SPREADSHEET) this.analyzers.set(m, sheet);
    for (const m of MIME_CATEGORIES.DOCUMENT) this.analyzers.set(m, doc);
    for (const m of MIME_CATEGORIES.ARCHIVE) this.analyzers.set(m, arch);

    // Category maps for wildcards
    this.categoryMap.set('image/*', image);
    this.categoryMap.set('text/*', text);
    this.categoryMap.set('video/*', video);
    this.categoryMap.set('audio/*', audio);
    this.categoryMap.set('application/*', doc); // many docs/archives use application/*
  }

  /**
   * Retrieves the analyzer for the provided MIME type. If an exact match is not found,
   * it attempts to find a category match or returns a fallback analyzer.
   *
   * @param mimeType - The MIME type for which the analyzer is to be retrieved.
   * @return The corresponding analyzer for the given MIME type, category, or the fallback analyzer.
   */
  getAnalyzer(mimeType: string): BaseAnalyzerType {
    if (this.analyzers.has(mimeType))
      return this.analyzers.get(mimeType) as BaseAnalyzerType;
    const [cat] = mimeType.split('/');
    if (this.categoryMap.has(`${cat}/*`))
      return this.categoryMap.get(`${cat}/*`) as BaseAnalyzerType;
    return this.fallback;
  }

  /**
   * Registers a custom analyzer for the specified MIME types. The provided analyzer will handle
   * the analysis for the given MIME types.
   *
   * @param mimeTypes An array of MIME types this analyzer supports.
   * @param analyzer The custom analyzer to register for the specified MIME types.
   * @return void
   */
  registerCustomAnalyzer(
    mimeTypes: string[],
    analyzer: BaseAnalyzerType,
  ): void {
    for (const m of mimeTypes) this.analyzers.set(m, analyzer);
  }
}
