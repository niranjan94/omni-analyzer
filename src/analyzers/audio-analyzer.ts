import * as musicMetadata from 'music-metadata';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, AudioMetadata } from '../types.js';
import { formatDuration } from '../utils/file-utils.js';
import { BaseAnalyzer } from './base-analyzer.js';

export class AudioAnalyzer extends BaseAnalyzer {
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<AudioMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

    const metadata = await this.withTimeout(
      musicMetadata.parseFile(filepath, { duration: true }),
      merged.timeout,
    );

    const format = metadata.format || {};
    const common = metadata.common || {};

    const duration = Number(format.duration || 0);

    return {
      duration,
      durationFormatted: formatDuration(duration),
      bitrate: Number(format.bitrate || 0),
      sampleRate: Number(format.sampleRate || 0),
      channels: Number(format.numberOfChannels || 0),
      codec: String(format.codec || format.container || ''),
      artist: common.artist || undefined,
      title: common.title || undefined,
      album: common.album || undefined,
    };
  }

  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.AUDIO as unknown as string[];
  }
}
