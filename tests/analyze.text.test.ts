import { describe } from 'vitest';
import { TextAnalyzer } from '@/analyzers/text-analyzer.js';
import { testAnalyzer } from '@/tests/base.js';

describe('TextAnalyzer', () => testAnalyzer(new TextAnalyzer(), 'text'));
