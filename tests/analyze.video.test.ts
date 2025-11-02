import { describe } from 'vitest';
import { VideoAnalyzer } from '@/analyzers/video-analyzer.js';
import { testAnalyzer } from '@/tests/base.js';

describe('VideoAnalyzer', () => testAnalyzer(new VideoAnalyzer(), 'videos'));
