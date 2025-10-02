import fs from 'node:fs';
import path from 'node:path';
import csvParser from 'csv-parser';
import { Workbook } from 'exceljs';
import { MIME_CATEGORIES, SIZE_LIMITS } from '../constants.js';
import type {
  AnalyzerOptions,
  SheetInfo,
  SpreadsheetMetadata,
} from '../types.js';
import { BaseAnalyzer } from './base-analyzer.js';

export class SpreadsheetAnalyzer extends BaseAnalyzer {
  async analyze(
    filepath: string,
    options?: AnalyzerOptions,
  ): Promise<SpreadsheetMetadata> {
    await this.validateFile(filepath);
    const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

    const ext = path.extname(filepath).toLowerCase();
    if (ext === '.csv') {
      return this.analyzeCsv(filepath, merged);
    }
    // Assume Excel for xlsx/xls
    return this.analyzeExcel(filepath, merged);
  }

  private async analyzeCsv(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<SpreadsheetMetadata> {
    // Use csv-parser streaming
    let rowCount = 0;
    let columnCount = 0;
    let columns: string[] = [];
    const sampleLimit = opts.sampleSize ?? SIZE_LIMITS.CSV_SAMPLE_SIZE;

    await this.withTimeout(
      new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(filepath);
        stream
          .pipe(csvParser())
          .on('headers', (hdrs: string[]) => {
            columns = hdrs;
            columnCount = hdrs.length;
          })
          .on('data', () => {
            rowCount++;
            if (rowCount >= sampleLimit && opts.skipContent) {
              stream.destroy();
            }
          })
          .on('error', (err) => reject(err))
          .on('close', () => resolve())
          .on('end', () => resolve());
      }),
      opts.timeout,
    );

    const sheets: SheetInfo[] = [
      {
        name: 'CSV',
        rowCount,
        columnCount,
        columns,
      },
    ];

    return {
      rowCount,
      columnCount,
      columns,
      sheetCount: 1,
      sheets,
      hasFormulas: false,
    };
  }

  private async analyzeExcel(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<SpreadsheetMetadata> {
    const wb = new Workbook();

    const sheets: SheetInfo[] = [];
    let totalRows = 0;
    let maxCols = 0;
    const sampleLimit = opts.sampleSize ?? SIZE_LIMITS.EXCEL_SAMPLE_SIZE;

    await this.withTimeout(
      new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(filepath);
        wb.xlsx
          .read(stream)
          .then(async () => {
            wb.eachSheet((ws) => {
              let rows = 0;
              let columns: string[] = [];
              let colsCount = 0;

              ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                rows++;
                if (rowNumber === 1) {
                  columns = (
                    typeof row.values?.slice === 'function'
                      ? row.values?.slice?.(1)
                      : row.values?.slice
                        ? [row.values.slice]
                        : []
                  ) as string[];
                  colsCount = columns.length;
                } else {
                  colsCount = Math.max(colsCount, row.cellCount || 0);
                }
                if (opts.skipContent && rows >= sampleLimit) return;
              });

              sheets.push({
                name: ws.name,
                rowCount: rows,
                columnCount: colsCount,
                columns,
              });
              totalRows += rows;
              maxCols = Math.max(maxCols, colsCount);
            });
            resolve();
          })
          .catch(reject);
      }),
      opts.timeout,
    );

    return {
      rowCount: totalRows,
      columnCount: maxCols,
      columns: sheets[0]?.columns || [],
      sheetCount: sheets.length,
      sheets,
      hasFormulas: false, // Skipped for performance
    };
  }

  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.SPREADSHEET as unknown as string[];
  }
}
