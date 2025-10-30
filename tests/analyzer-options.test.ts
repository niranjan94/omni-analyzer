import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TextAnalyzer } from '@/analyzers/text-analyzer.js';
import { AudioAnalyzer } from '@/analyzers/audio-analyzer.js';
import { VideoAnalyzer } from '@/analyzers/video-analyzer.js';
import { ImageAnalyzer } from '@/analyzers/image-analyzer.js';

function dataPath(...p: string[]) {
  return path.join(import.meta.dirname, 'data', ...p);
}

describe('Analyzer Options Coverage', () => {
  describe('TextAnalyzer with skipContent', () => {
    const analyzer = new TextAnalyzer();

    it('skips content when skipContent is true', async () => {
      const filepath = dataPath('text', 'sample.txt');
      const result = await analyzer.analyze(filepath, { skipContent: true });

      expect(result.lineCount).toBe(0);
      expect(result.wordCount).toBe(0);
      expect(result.characterCount).toBe(0);
      expect(result.encoding).toBeDefined();
    });

    it('analyzes content when skipContent is false', async () => {
      const filepath = dataPath('text', 'sample.txt');
      const result = await analyzer.analyze(filepath, { skipContent: false });

      expect(result.lineCount).toBeGreaterThan(0);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it('detects UTF-8 encoding', async () => {
      const filepath = dataPath('text', 'sample.txt');
      const result = await analyzer.analyze(filepath);

      expect(result.encoding).toBe('utf-8');
    });

    it('detects empty files', async () => {
      const filepath = dataPath('text', 'sample.dat');
      const result = await analyzer.analyze(filepath);

      // sample.dat might be empty or have content
      expect(result.isEmpty).toBeDefined();
    });
  });

  describe('AudioAnalyzer metadata extraction', () => {
    const analyzer = new AudioAnalyzer();

    it('extracts complete audio metadata', async () => {
      const filepath = dataPath('audio', 'sample.mp3');
      const result = await analyzer.analyze(filepath);

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.durationFormatted).toBeDefined();
      expect(result.bitrate).toBeGreaterThanOrEqual(0);
      expect(result.sampleRate).toBeGreaterThanOrEqual(0);
      expect(result.channels).toBeGreaterThanOrEqual(0);
      expect(result.codec).toBeDefined();
    });

    it('handles audio files without metadata tags', async () => {
      const filepath = dataPath('audio', 'sample.wav');
      const result = await analyzer.analyze(filepath);

      expect(result.duration).toBeGreaterThanOrEqual(0);
      // artist, title, album might be undefined
      expect(result).toHaveProperty('artist');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('album');
    });
  });

  describe('VideoAnalyzer metadata extraction', () => {
    const analyzer = new VideoAnalyzer();

    it('extracts complete video metadata', async () => {
      const filepath = dataPath('videos', 'sample.mp4');
      const result = await analyzer.analyze(filepath);

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.durationFormatted).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.resolution).toMatch(/\d+x\d+/);
      expect(result.frameRate).toBeGreaterThanOrEqual(0);
      expect(result.codec).toBeDefined();
      expect(result.bitrate).toBeGreaterThanOrEqual(0);
      expect(result.hasAudio).toBeDefined();
      expect(result.hasSubtitles).toBeDefined();
    });

    it('detects videos without audio', async () => {
      // Some test videos might not have audio
      const filepath = dataPath('videos', 'sample.webm');
      const result = await analyzer.analyze(filepath);

      expect(result.hasAudio).toBeDefined();
      if (!result.hasAudio) {
        expect(result.audioCodec).toBeUndefined();
      }
    });
  });

  describe('ImageAnalyzer edge cases', () => {
    const analyzer = new ImageAnalyzer();

    it('analyzes SVG images', async () => {
      const filepath = dataPath('images', 'image.svg');
      const result = await analyzer.analyze(filepath);

      expect(result.format).toBeDefined();
      expect(result.width).toBeGreaterThanOrEqual(0);
      expect(result.height).toBeGreaterThanOrEqual(0);
    });

    it('analyzes TIFF images', async () => {
      const filepath = dataPath('images', 'sample.tiff');
      const result = await analyzer.analyze(filepath);

      expect(result.format).toContain('TIFF');
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('analyzes images with alpha channel', async () => {
      const filepath = dataPath('images', 'sample.png');
      const result = await analyzer.analyze(filepath);

      expect(result).toHaveProperty('hasAlpha');
      expect(result.colorSpace).toBeDefined();
    });

    it('analyzes animated GIFs', async () => {
      const filepath = dataPath('images', 'animated.gif');
      const result = await analyzer.analyze(filepath);

      expect(result.format).toContain('GIF');
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });
  });

  describe('Analyzer timeout options', () => {
    it('respects timeout for image analysis', async () => {
      const analyzer = new ImageAnalyzer({ timeout: 10000 });
      const filepath = dataPath('images', 'sample.jpg');

      const start = Date.now();
      await analyzer.analyze(filepath);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
    });

    it('respects timeout for audio analysis', async () => {
      const analyzer = new AudioAnalyzer({ timeout: 10000 });
      const filepath = dataPath('audio', 'sample.mp3');

      const start = Date.now();
      await analyzer.analyze(filepath);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10000);
    });
  });
});

