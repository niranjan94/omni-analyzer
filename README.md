[![Build and Test](https://github.com/niranjan94/omni-analyzer/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/niranjan94/omni-analyzer/actions/workflows/build-and-test.yml) [![codecov](https://codecov.io/gh/niranjan94/omni-analyzer/graph/badge.svg?token=VBYUU1C4M9)](https://codecov.io/gh/niranjan94/omni-analyzer) [![NPM Version](https://img.shields.io/npm/v/omni-analyzer)](https://www.npmjs.com/package/omni-analyzer)


# Omni Analyzer

A comprehensive TypeScript library for analyzing various file types and extracting detailed metadata. The library supports images, videos, audio files, documents, spreadsheets, archives, and text files with both synchronous and asynchronous processing capabilities.

## Features

- **Multi-format Support**: Analyze images, videos, audio, PDFs, Office documents, spreadsheets, archives, and text files
- **Detailed Metadata Extraction**: Get comprehensive information about file properties, dimensions, durations, and content
- **Streaming Support**: Process large files efficiently with streaming capabilities
- **Concurrent Processing**: Analyze multiple files simultaneously with configurable concurrency
- **Type Safety**: Full TypeScript support with detailed type definitions
- **Error Handling**: Robust error handling with detailed error messages
- **Configurable Options**: Flexible configuration for timeouts, file size limits, and analysis depth

## Installation

> Please note that this package is ESM only

```bash
npm install omni-analyzer
```

## Supported File Types

### Images
- JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, HEIC, HEIF
- Extracts: dimensions, resolution, aspect ratio, color space, alpha channel, format, bit depth

### Videos
- MP4, QuickTime, AVI, MKV, WebM, MPEG
- Extracts: duration, dimensions, frame rate, codec, bitrate, audio codec, subtitle presence

### Audio
- MP3, WAV, OGG, FLAC, AAC, M4A
- Extracts: duration, bitrate, sample rate, channels, codec, metadata (artist, title, album)

### Documents
- PDF, Word (DOCX, DOC), RTF, Plain Text
- Extracts: page count, word count, character count, language, author, title, content analysis

### Spreadsheets
- Excel (XLSX, XLS), CSV
- Extracts: row/column count, sheet information, column headers, formula detection

### Archives
- ZIP, TAR, GZIP, 7Z, RAR
- Extracts: file count, compression ratio, file listing, encryption status

### Text Files
- Plain text, HTML, CSS, JSON, XML, Markdown
- Extracts: line count, word count, character count, encoding, language detection

## Usage

### Basic Usage

```typescript
import { FileAnalyzer } from 'omni-analyzer';

const analyzer = new FileAnalyzer();

// Analyze a single file
const result = await analyzer.analyzeFile('/path/to/file.jpg');

console.log('Base metadata:', result.base);
console.log('Specific metadata:', result.specific);
console.log('Analysis time:', result.analysisTime, 'ms');
```

### Batch Analysis

```typescript
const files = [
  '/path/to/image.jpg',
  '/path/to/video.mp4',
  '/path/to/document.pdf'
];

const results = await analyzer.analyzeFiles(files, {
  concurrency: 3 // Process 3 files simultaneously
});

results.forEach((result, index) => {
  console.log(`File ${index + 1}:`, result.base.filename);
  console.log('Type:', result.base.mimeType);
  console.log('Size:', result.base.sizeFormatted);
});
```

### Configuration Options

```typescript
const analyzer = new FileAnalyzer({
  maxFileSize: 100 * 1024 * 1024, // 100MB limit
  timeout: 15000, // 15 second timeout
  skipContent: false, // Include content analysis
  sampleSize: 500, // Sample 500 rows for CSV files
  extractText: true, // Extract text from documents
  deepAnalysis: true // More thorough analysis
});
```

## API Reference

### FileAnalyzer Class

#### Constructor

```typescript
constructor(options?: AnalyzerOptions)
```

#### Methods

##### analyzeFile(filepath, options?)

Analyzes a single file and returns detailed metadata.

```typescript
async analyzeFile(
  filepath: string,
  options?: AnalyzerOptions
): Promise<FileAnalysisResult>
```

##### analyzeFiles(filepaths, options?)

Analyzes multiple files concurrently.

```typescript
async analyzeFiles(
  filepaths: string[],
  options?: AnalyzerOptions & { concurrency?: number }
): Promise<FileAnalysisResult[]>
```

### Types

#### AnalyzerOptions

```typescript
interface AnalyzerOptions {
  maxFileSize?: number;     // Max file size in bytes (default: 500MB)
  timeout?: number;         // Analysis timeout in ms (default: 30000)
  skipContent?: boolean;    // Skip content analysis (default: false)
  sampleSize?: number;      // Sample size for CSV/text (default: 1000)
  extractText?: boolean;    // Extract text from documents (default: false)
  deepAnalysis?: boolean;   // Enable deep analysis (default: false)
}
```

#### FileAnalysisResult

```typescript
interface FileAnalysisResult {
  base: BaseFileMetadata;           // Basic file information
  specific: TypeSpecificMetadata;   // Type-specific metadata
  analysisTime: number;             // Analysis duration in ms
  error?: string;                   // Error message if analysis failed
}
```

#### BaseFileMetadata

```typescript
interface BaseFileMetadata {
  filename: string;
  filepath: string;
  size: number;
  sizeFormatted: string;
  extension: string;
  mimeType: string | null;
}
```

### Type-Specific Metadata

#### ImageMetadata

```typescript
interface ImageMetadata {
  width: number;
  height: number;
  resolution: string;        // "1920x1080"
  aspectRatio: string;       // "16:9"
  colorSpace?: string;
  hasAlpha?: boolean;
  format: string;
  bitDepth?: number;
}
```

#### VideoMetadata

```typescript
interface VideoMetadata {
  duration: number;
  durationFormatted: string; // "00:05:30"
  width: number;
  height: number;
  resolution: string;
  frameRate: number;
  codec: string;
  bitrate: number;
  audioCodec?: string;
  hasAudio: boolean;
  hasSubtitles: boolean;
}
```

#### AudioMetadata

```typescript
interface AudioMetadata {
  duration: number;
  durationFormatted: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
  artist?: string;
  title?: string;
  album?: string;
}
```

## Examples

### Image Analysis

```typescript
const result = await analyzer.analyzeFile('/path/to/photo.jpg');

if (result.base.mimeType?.startsWith('image/')) {
  const imageData = result.specific as ImageMetadata;
  console.log(`Image: ${imageData.width}x${imageData.height}`);
  console.log(`Format: ${imageData.format}`);
  console.log(`Aspect Ratio: ${imageData.aspectRatio}`);
}
```

### Video Analysis

```typescript
const result = await analyzer.analyzeFile('/path/to/video.mp4');

if (result.base.mimeType?.startsWith('video/')) {
  const videoData = result.specific as VideoMetadata;
  console.log(`Duration: ${videoData.durationFormatted}`);
  console.log(`Resolution: ${videoData.resolution}`);
  console.log(`Frame Rate: ${videoData.frameRate} fps`);
  console.log(`Has Audio: ${videoData.hasAudio}`);
}
```

### Document Analysis

```typescript
const result = await analyzer.analyzeFile('/path/to/document.pdf', {
  extractText: true
});

if (result.base.mimeType === 'application/pdf') {
  const docData = result.specific as DocumentMetadata;
  console.log(`Pages: ${docData.pageCount}`);
  console.log(`Words: ${docData.wordCount}`);
  console.log(`Author: ${docData.author}`);
}
```

### Spreadsheet Analysis

```typescript
const result = await analyzer.analyzeFile('/path/to/data.xlsx');

if (result.base.mimeType?.includes('spreadsheet')) {
  const sheetData = result.specific as SpreadsheetMetadata;
  console.log(`Rows: ${sheetData.rowCount}`);
  console.log(`Columns: ${sheetData.columnCount}`);
  console.log(`Sheets: ${sheetData.sheetCount}`);
  console.log(`Has Formulas: ${sheetData.hasFormulas}`);
}
```

## Error Handling

```typescript
const result = await analyzer.analyzeFile('/path/to/file.unknown');

if (result.error) {
  console.error('Analysis failed:', result.error);
} else {
  console.log('Analysis successful:', result.specific);
}
```

## Performance Considerations

- **File Size Limits**: Default maximum file size is 500MB
- **Timeout Configuration**: Default timeout is 30 seconds per file
- **Concurrency**: Default concurrency for batch processing is 5 files
- **Memory Usage**: Large files are processed using streaming where possible
- **Sampling**: For large CSV/text files, only a sample is analyzed by default

## Dependencies

The library uses several specialized packages for different file types:

- **file-type**: MIME type detection
- **sharp**: Image processing
- **fluent-ffmpeg**: Video/audio analysis
- **music-metadata**: Audio metadata extraction
- **pdf-parse**: PDF document parsing
- **mammoth**: Word document processing
- **exceljs**: Excel file analysis
- **csv-parser**: CSV file parsing
- **yauzl**: Archive file extraction

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run format
```

## License

```
MIT License

Copyright (c) 2025 Niranjan Rajendran

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
