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

export class AnalyzerRegistry {
  private static instance: AnalyzerRegistry;
  private analyzers: Map<string, BaseAnalyzerType>;
  private categoryMap: Map<string, BaseAnalyzerType>;
  private fallback: BaseAnalyzerType;

  private constructor() {
    this.analyzers = new Map();
    this.categoryMap = new Map();
    this.fallback = new FallbackAnalyzer();
    this.registerAnalyzers();
  }

  static getInstance(): AnalyzerRegistry {
    if (!AnalyzerRegistry.instance) {
      AnalyzerRegistry.instance = new AnalyzerRegistry();
    }
    return AnalyzerRegistry.instance;
  }

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

  getAnalyzer(mimeType: string): BaseAnalyzerType {
    if (this.analyzers.has(mimeType))
      return this.analyzers.get(mimeType) as BaseAnalyzerType;
    const [cat] = mimeType.split('/');
    if (this.categoryMap.has(`${cat}/*`))
      return this.categoryMap.get(`${cat}/*`) as BaseAnalyzerType;
    return this.fallback;
  }

  registerCustomAnalyzer(
    mimeTypes: string[],
    analyzer: BaseAnalyzerType,
  ): void {
    for (const m of mimeTypes) this.analyzers.set(m, analyzer);
  }
}
