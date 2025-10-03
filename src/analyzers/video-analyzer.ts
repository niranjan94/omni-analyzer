import * as ffmpeg from 'fluent-ffmpeg';
import { withTimeout } from '@/utils/async-utils.js';
import { MIME_CATEGORIES } from '../constants.js';
import type { AnalyzerOptions, VideoMetadata } from '../types.js';
import { formatDuration } from '../utils/file-utils.js';
import { BaseAnalyzer } from './base-analyzer.js';

/**
 * Represents a video file analyzer capable of extracting metadata and properties
 * such as duration, resolution, frame rate, and codecs, as well as verifying
 * supported MIME types.
 */
export class VideoAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes a video file and extracts metadata about its properties and streams.
   *
   * @param filepath The path to the video file to analyze.
   * @param options Optional settings to customize the analysis process.
   * @return A promise that resolves with metadata about the video, including duration, resolution, frame rate, and codecs.
   */
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<VideoMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;
    const probe = await withTimeout(
      new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
        try {
          ffmpeg.default.ffprobe(filepath, (err, data) =>
            err ? reject(err) : resolve(data),
          );
        } catch (err) {
          reject(err);
        }
      }),
      merged.timeout,
    );

    // Extract streams info
    const streams = probe.streams || [];
    const format = probe.format || {};

    const videoStream = streams.find((s) => s.codec_type === 'video');
    const audioStream = streams.find((s) => s.codec_type === 'audio');
    const subtitleStream = streams.find((s) => s.codec_type === 'subtitle');

    const width = Number(videoStream?.width || 0);
    const height = Number(videoStream?.height || 0);
    const fps = (() => {
      const r =
        videoStream?.avg_frame_rate || videoStream?.r_frame_rate || '0/1';
      const [num, den] = String(r)
        .split('/')
        .map((x: string) => Number(x) || 0);
      return den ? Number((num / den).toFixed(3)) : 0;
    })();

    const durationSec = Number(format.duration || videoStream?.duration || 0);
    const bitRate = Number(format.bit_rate || videoStream?.bit_rate || 0);

    return {
      duration: durationSec,
      durationFormatted: formatDuration(durationSec),
      width,
      height,
      resolution: `${width}x${height}`,
      frameRate: fps,
      codec: String(videoStream?.codec_name || ''),
      bitrate: bitRate,
      audioCodec: audioStream?.codec_name || undefined,
      hasAudio: Boolean(audioStream),
      hasSubtitles: Boolean(subtitleStream),
    };
  }

  /**
   * Retrieves the list of supported MIME types for video files.
   *
   * @return An array containing the supported MIME type strings.
   */
  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.VIDEO as unknown as string[];
  }
}
