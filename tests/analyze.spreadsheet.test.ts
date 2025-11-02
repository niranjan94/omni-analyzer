import { describe } from 'vitest';
import { SpreadsheetAnalyzer } from '@/analyzers/spreadsheet-analyzer.js';
import { testAnalyzer } from '@/tests/base.js';

describe('SpreadsheetAnalyzer', () =>
  testAnalyzer(new SpreadsheetAnalyzer(), 'spreadsheets'));
