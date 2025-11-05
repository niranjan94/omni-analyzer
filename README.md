[![Build and Test](https://github.com/niranjan94/omni-analyzer/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/niranjan94/omni-analyzer/actions/workflows/build-and-test.yml) [![codecov](https://codecov.io/gh/niranjan94/omni-analyzer/graph/badge.svg?token=VBYUU1C4M9)](https://codecov.io/gh/niranjan94/omni-analyzer) [![NPM Version](https://img.shields.io/npm/v/omni-analyzer)](https://www.npmjs.com/package/omni-analyzer)

# Omni Analyzer

A comprehensive TypeScript library for analyzing various file types and extracting detailed metadata. The library supports images, videos, audio files, documents, spreadsheets, archives, and text files with both synchronous and asynchronous processing capabilities.

## Links

- [NPM Package](https://www.npmjs.com/package/omni-analyzer)
- [GitHub Repository](https://github.com/niranjan94/omni-analyzer)
- [Report Issues](https://github.com/niranjan94/omni-analyzer/issues)
- [Changelog](https://github.com/niranjan94/omni-analyzer/releases)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Supported File Types](#supported-file-types)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Batch Analysis](#batch-analysis)
  - [Configuration Options](#configuration-options)
  - [Data Extraction](#data-extraction)
- [Examples](#examples)
  - [Image Analysis](#image-analysis)
  - [Video Analysis](#video-analysis)
  - [Document Analysis](#document-analysis)
  - [Spreadsheet Analysis](#spreadsheet-analysis)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)
- [Dependencies](#dependencies)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-format Support**: Analyze images, videos, audio, PDFs, Office documents, spreadsheets, archives, and text files
- **Detailed Metadata Extraction**: Get comprehensive information about file properties, dimensions, durations, and content
- **Full Data Extraction**: Extract complete text content from documents, all rows from spreadsheets, and full text from files with the `extractData` option
- **Streaming Support**: Process large files efficiently with streaming capabilities
- **Concurrent Processing**: Analyze multiple files simultaneously with configurable concurrency
- **Type Safety**: Full TypeScript support with detailed type definitions
- **Error Handling**: Robust error handling with detailed error messages
- **Configurable Options**: Flexible configuration for timeouts, file size limits, sample sizes, and analysis depth

## Installation

> Please note that this package is ESM only

```bash
npm install omni-analyzer
```

## Quick Start

Get up and running in seconds:

```typescript
import { FileAnalyzer } from 'omni-analyzer';

const analyzer = new FileAnalyzer();
const result = await analyzer.analyzeFile('/path/to/your/file.pdf');

console.log(result);
// {
//   base: { filename, size, mimeType, ... },
//   specific: { pageCount, wordCount, ... },
//   analysisTime: 142
// }
```

## Supported File Types

### Images
**Formats**: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, HEIC, HEIF

**Extracted Metadata**:
- Dimensions (width × height)
- Resolution and DPI
- Aspect ratio
- Color space and bit depth
- Alpha channel presence
- Image format details

### Videos
**Formats**: MP4, QuickTime, AVI, MKV, WebM, MPEG

**Extracted Metadata**:
- Duration (formatted and raw)
- Dimensions and resolution
- Frame rate (fps)
- Video codec and bitrate
- Audio codec and presence
- Subtitle track presence

### Audio
**Formats**: MP3, WAV, OGG, FLAC, AAC, M4A

**Extracted Metadata**:
- Duration and bitrate
- Sample rate and channels
- Audio codec
- ID3 tags (artist, title, album, year, genre)
- Track and disc numbers

### Documents
**Formats**: PDF, Word (DOCX, DOC), RTF, Plain Text

**Extracted Metadata**:
- Page count
- Word and character count
- Language detection
- Author, title, subject
- Creation and modification dates
- Full text content (with `extractData: true`)

### Spreadsheets
**Formats**: Excel (XLSX, XLS), CSV

**Extracted Metadata**:
- Row and column count
- Sheet count and names
- Column headers
- Formula detection
- Full data extraction (with `extractData: true`)
- Sample data preview

### Archives
**Formats**: ZIP, TAR, GZIP, 7Z, RAR

**Extracted Metadata**:
- Total file count
- Compression ratio
- Complete file listing
- Encryption status
- Archive format details

### Text Files
**Formats**: Plain text, HTML, CSS, JSON, XML, Markdown

**Extracted Metadata**:
- Line, word, and character count
- File encoding detection
- Language detection
- Full text content (with `extractData: true`)

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

Efficiently process multiple files in parallel:

```typescript
const files = [
  '/path/to/image.jpg',
  '/path/to/video.mp4',
  '/path/to/document.pdf',
  '/path/to/spreadsheet.xlsx'
];

const results = await analyzer.analyzeFiles(files, {
  concurrency: 3, // Process 3 files simultaneously
  extractData: true // Extract full data from all files
});

// Process results
results.forEach((result) => {
  if (result.error) {
    console.error(`Error analyzing ${result.base.filename}:`, result.error);
    return;
  }

  console.log(`\n${result.base.filename}:`);
  console.log(`  Type: ${result.base.mimeType}`);
  console.log(`  Size: ${result.base.sizeFormatted}`);
  console.log(`  Analysis Time: ${result.analysisTime}ms`);

  // Type-specific information
  if (result.base.mimeType?.startsWith('image/')) {
    const img = result.specific as ImageMetadata;
    console.log(`  Dimensions: ${img.width}x${img.height}`);
  } else if (result.base.mimeType?.startsWith('video/')) {
    const vid = result.specific as VideoMetadata;
    console.log(`  Duration: ${vid.durationFormatted}`);
  } else if (result.base.mimeType === 'application/pdf') {
    const doc = result.specific as DocumentMetadata;
    console.log(`  Pages: ${doc.pageCount}, Words: ${doc.wordCount}`);
  }
});
```

### Configuration Options

```typescript
const analyzer = new FileAnalyzer({
  maxFileSize: 100 * 1024 * 1024, // 100MB limit
  timeout: 15000, // 15 second timeout
  sampleSize: 500, // Sample 500 rows for CSV files
  extractData: false, // Extract full data/text content
  failSilent: false // Throw errors for unsupported types
});
```

### Data Extraction

The `extractData` option enables full data extraction from documents, spreadsheets, and text files. By default, this is `false` to optimize for performance and memory usage.

#### Extract Text from Documents

```typescript
// Extract full text from PDF or Word documents
const result = await analyzer.analyzeFile('/path/to/document.pdf', {
  extractData: true
});

if (result.base.mimeType === 'application/pdf') {
  const docData = result.specific as DocumentMetadata;
  console.log('Full text:', docData.text);
  console.log('Word count:', docData.wordCount);
}
```

#### Extract Data from Spreadsheets

```typescript
// Extract all rows and columns from spreadsheets
const result = await analyzer.analyzeFile('/path/to/data.xlsx', {
  extractData: true
});

if (result.base.mimeType?.includes('spreadsheet')) {
  const sheetData = result.specific as SpreadsheetMetadata;
  console.log('All data:', sheetData.data);
  console.log('Column headers:', sheetData.columns);
}
```

#### Extract Content from Text Files

```typescript
// Extract full content from text files
const result = await analyzer.analyzeFile('/path/to/file.txt', {
  extractData: true
});

const textData = result.specific as TextMetadata;
console.log('Full text:', textData.text);
console.log('Line count:', textData.lineCount);
```

**Note**: When `extractData` is `false` (default), only metadata and statistics are extracted. Use `sampleSize` to control how many rows are sampled from large CSV files:

```typescript
// Analyze only the first 100 rows of a large CSV
const result = await analyzer.analyzeFile('/path/to/large.csv', {
  extractData: false,
  sampleSize: 100
});
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
  extractData: true
});

if (result.base.mimeType === 'application/pdf') {
  const docData = result.specific as DocumentMetadata;
  console.log(`Pages: ${docData.pageCount}`);
  console.log(`Words: ${docData.wordCount}`);
  console.log(`Author: ${docData.author}`);
  console.log(`Full text: ${docData.text?.substring(0, 100)}...`);
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

## Troubleshooting

### FFmpeg Not Found

If you encounter errors related to FFmpeg when analyzing video or audio files:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### Out of Memory Errors

For large files, try these strategies:

```typescript
// Reduce sample size for spreadsheets
const result = await analyzer.analyzeFile('/path/to/large.xlsx', {
  sampleSize: 100,
  extractData: false
});

// Increase timeout for complex files
const analyzer = new FileAnalyzer({
  timeout: 60000, // 60 seconds
  maxFileSize: 200 * 1024 * 1024 // 200MB
});
```

### Unsupported File Types

For unsupported or corrupted files:

```typescript
// Use failSilent to continue processing without errors
const result = await analyzer.analyzeFile('/path/to/unknown.file', {
  failSilent: true
});

if (result.error) {
  console.log('File type not supported or file is corrupted');
}
```

### Type Errors with TypeScript

Make sure to import the correct types:

```typescript
import {
  FileAnalyzer,
  ImageMetadata,
  VideoMetadata,
  DocumentMetadata,
  SpreadsheetMetadata,
  TextMetadata
} from 'omni-analyzer';
```

## Dependencies

The library uses several specialized packages for different file types:

- **file-type**: MIME type detection
- **sharp**: Image processing
- **fluent-ffmpeg**: Video/audio analysis
- **music-metadata**: Audio metadata extraction
- **pdf-parse**: PDF document parsing
- **mammoth**: Word document processing
- **exceljs**: Excel file analysis
- **csv-parse**: CSV file parsing
- **yauzl**: Archive file extraction

## Development

### Building

```bash
pnpm run build
```

### Testing

```bash
pnpm test
```

### Linting

```bash
pnpm run lint
pnpm run format
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create your branch from `main`
2. **Write tests** for any new features or bug fixes
3. **Ensure tests pass** by running `pnpm test`
4. **Follow the existing code style** and run `pnpm run format`
5. **Update documentation** if you're adding new features
6. **Submit a pull request** with a clear description of your changes

### Reporting Issues

If you encounter bugs or have feature requests, please:

- Check existing [issues](https://github.com/niranjan94/omni-analyzer/issues) first
- Provide detailed information including:
  - File type and size being analyzed
  - Error messages or unexpected behavior
  - Environment details (OS, Node.js version)
  - Minimal code example to reproduce the issue

### Development Setup

```bash
# Clone the repository
git clone https://github.com/niranjan94/omni-analyzer.git
cd omni-analyzer

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the project
pnpm build
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
