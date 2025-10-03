import { createReadStream } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import tarStream from 'tar-stream';
import yauzl from 'yauzl';
import { withTimeout } from '@/utils/async-utils.js';
import { MIME_CATEGORIES } from '../constants.js';
import type {
  AnalyzerOptions,
  ArchiveFileEntry,
  ArchiveMetadata,
} from '../types.js';
import { BaseAnalyzer } from './base-analyzer.js';

/**
 * Represents a class responsible for analyzing archive files such as ZIP and TAR,
 * extracting metadata such as file count, uncompressed size, compression ratio, and encryption status.
 * Provides functionality to analyze archives based on their type and retrieve supported MIME types.
 */
export class ArchiveAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes the given file to extract metadata based on its archive type.
   *
   * @param filepath The path to the file that needs to be analyzed.
   * @param options Optional configuration that customizes the behavior of the analyzer.
   * @return A promise that resolves to the metadata of the analyzed archive.
   */
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

  /**
   * Analyzes the contents of a ZIP file and extracts metadata such as file count, uncompressed size,
   * compression ratio, and encryption status.
   *
   * @param filepath The path to the ZIP file to be analyzed.
   * @param opts An object containing options required for the analysis, such as a timeout value.
   * @return An object containing metadata about the ZIP file, including the number of files,
   *         uncompressed size, compression ratio, file entries, and encryption status.
   */
  private async analyzeZip(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<ArchiveMetadata> {
    const entries: ArchiveFileEntry[] = [];
    let fileCount = 0;
    let uncompressedSize = 0;
    let compressedSize = 0;
    let isEncrypted = false;

    await withTimeout(
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

  /**
   * Analyzes a tar archive file and collects metadata such as file count, uncompressed size, and file entries.
   *
   * @param filepath The path to the tar archive file to be analyzed.
   * @param opts The analyzer options, including configuration such as timeout.
   * @param gz A flag indicating whether the tar file is gzipped and should be decompressed.
   * @return A promise that resolves to an object containing metadata about the archive,
   *         including file count, uncompressed size, compression ratio, file entries, and encryption status.
   */
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

    await withTimeout(
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

  /**
   * Retrieves a list of supported MIME types.
   *
   * @return An array of strings representing the supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.ARCHIVE as unknown as string[];
  }
}
