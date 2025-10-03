import * as musicMetadata from 'music-metadata';
import { withTimeout } from '@/utils/async-utils.js';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, AudioMetadata } from '../types.js';
import { formatDuration } from '../utils/file-utils.js';
import { BaseAnalyzer } from './base-analyzer.js';

/**
 * The `AudioAnalyzer` class is responsible for analyzing audio files and extracting metadata such as
 * duration, bitrate, sample rate, and other relevant audio information. It also provides a method to
 * retrieve the supported MIME types for audio files.
 */
export class AudioAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes the audio file at the specified filepath and extracts metadata.
   *
   * @param filepath The path to the audio file to analyze.
   * @param options Optional configuration options for the analyzer.
   * @return A promise that resolves to an object containing the audio metadata,
   *         including duration, formatted duration, bitrate, sample rate, channels, codec,
   *         artist, title, and album.
   */
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<AudioMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

    const metadata = await withTimeout(
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

  /**
   * Retrieves the list of supported MIME types for audio.
   *
   * @return An array of strings representing the supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.AUDIO as unknown as string[];
  }
}
