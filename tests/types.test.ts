import { describe, expect, it } from 'vitest';
import {
  AnalysisTimeoutError,
  FileAnalyzerError,
  FileReadError,
  FileSizeLimitError,
  UnsupportedFileTypeError,
} from '@/types.js';

describe('Error Classes', () => {
  describe('FileAnalyzerError', () => {
    it('creates error with message and code', () => {
      const error = new FileAnalyzerError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('FileAnalyzerError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('FileSizeLimitError', () => {
    it('creates error with size and limit', () => {
      const error = new FileSizeLimitError(1000000, 500000);
      expect(error.message).toBe('File size 1000000 exceeds limit 500000');
      expect(error.code).toBe('FILE_SIZE_LIMIT');
      expect(error.name).toBe('FileAnalyzerError');
      expect(error).toBeInstanceOf(FileAnalyzerError);
    });
  });

  describe('FileReadError', () => {
    it('creates error with custom message', () => {
      const error = new FileReadError('Failed to read file');
      expect(error.message).toBe('Failed to read file');
      expect(error.code).toBe('FILE_READ');
      expect(error.name).toBe('FileAnalyzerError');
      expect(error).toBeInstanceOf(FileAnalyzerError);
    });
  });

  describe('UnsupportedFileTypeError', () => {
    it('creates error with mime type', () => {
      const error = new UnsupportedFileTypeError('application/x-custom');
      expect(error.message).toBe('Unsupported file type: application/x-custom');
      expect(error.code).toBe('UNSUPPORTED_TYPE');
      expect(error.name).toBe('FileAnalyzerError');
      expect(error).toBeInstanceOf(FileAnalyzerError);
    });
  });

  describe('AnalysisTimeoutError', () => {
    it('creates error with timeout value', () => {
      const error = new AnalysisTimeoutError(5000);
      expect(error.message).toBe('Analysis timeout after 5000ms');
      expect(error.code).toBe('TIMEOUT');
      expect(error.name).toBe('FileAnalyzerError');
      expect(error).toBeInstanceOf(FileAnalyzerError);
    });
  });
});
