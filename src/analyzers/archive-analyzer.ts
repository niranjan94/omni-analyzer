import { createReadStream } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import tarStream from 'tar-stream';
import yauzl from 'yauzl';
import { MIME_CATEGORIES } from '../constants.js';
import type {
  AnalyzerOptions,
  ArchiveFileEntry,
  ArchiveMetadata,
} from '../types.js';
import { BaseAnalyzer } from './base-analyzer.js';

export class ArchiveAnalyzer extends BaseAnalyzer {
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<ArchiveMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

    const ext = path.extname(filepath).toLowerCase();
    if (ext === '.zip') return this.analyzeZip(filepath, merged);
    if (ext === '.tar') return this.analyzeTar(filepath, merged, false);
    if (ext === '.tgz' || ext === '.tar.gz' || ext === '.gz')
      return this.analyzeTar(filepath, merged, true);

    // default: try zip
    return this.analyzeZip(filepath, merged);
  }

  private async analyzeZip(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<ArchiveMetadata> {
    const entries: ArchiveFileEntry[] = [];
    let fileCount = 0;
    let uncompressedSize = 0;
    let compressedSize = 0;
    let isEncrypted = false;

    await this.withTimeout(
      new Promise<void>((resolve, reject) => {
        yauzl.open(filepath, { lazyEntries: true }, (err, zipfile) => {
          if (err) return reject(err);
          zipfile.on('entry', (entry) => {
            const isDir = /\/$/.test(entry.fileName);
            const size = entry.uncompressedSize || 0;
            const csize = entry.compressedSize || 0;
            entries.push({
              path: entry.fileName,
              size,
              compressedSize: csize,
              isDirectory: isDir,
            });
            if (!isDir) {
              fileCount++;
              uncompressedSize += size;
              compressedSize += csize;
            }
            if (entry.isEncrypted) isEncrypted = true;
            zipfile.readEntry();
          });
          zipfile.on('end', resolve);
          zipfile.on('error', reject);
          zipfile.readEntry();
        });
      }),
      opts.timeout,
    );

    const compressionRatio =
      uncompressedSize > 0
        ? Number((1 - compressedSize / uncompressedSize).toFixed(4))
        : 0;

    return {
      fileCount,
      uncompressedSize,
      compressionRatio,
      files: entries,
      isEncrypted,
    };
  }

  private async analyzeTar(
    filepath: string,
    opts: Required<AnalyzerOptions>,
    gz: boolean,
  ): Promise<ArchiveMetadata> {
    const extract = tarStream.extract();
    const entries: ArchiveFileEntry[] = [];
    let fileCount = 0;
    let uncompressedSize = 0;

    const stream = gz
      ? createReadStream(filepath).pipe(zlib.createGunzip())
      : createReadStream(filepath);

    await this.withTimeout(
      new Promise<void>((resolve, reject) => {
        extract.on('entry', (header, s, next) => {
          const isDir = header.type === 'directory';
          const size = header.size || 0;
          entries.push({
            path: header.name,
            size,
            compressedSize: size,
            isDirectory: isDir,
          });
          if (!isDir) {
            fileCount++;
            uncompressedSize += size;
          }
          s.on('end', next);
          s.resume();
        });
        extract.on('finish', resolve);
        extract.on('error', reject);
        stream.pipe(extract);
      }),
      opts.timeout,
    );

    return {
      fileCount,
      uncompressedSize,
      compressionRatio: 0,
      files: entries,
      isEncrypted: false,
    };
  }

  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.ARCHIVE as unknown as string[];
  }
}
