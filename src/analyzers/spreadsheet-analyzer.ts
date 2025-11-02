import * as fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import csvParser from 'csv-parser';
import { default as exceljs } from 'exceljs';
import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';
import { withTimeout } from '@/utils/async-utils.js';
import { MIME_CATEGORIES, SIZE_LIMITS } from '../constants.js';
import type {
  AnalyzerOptions,
  SheetInfo,
  SpreadsheetMetadata,
} from '../types.js';
import { BaseAnalyzer } from './base-analyzer.js';

XLSX.set_fs(fs);
XLSX.stream.set_readable(Readable);
XLSX.set_cptable(cpexcel);

/**
 * A class designed for analyzing spreadsheets, extracting metadata such as the number of rows, columns, sheets,
 * and other relevant information. This class supports common spreadsheet formats including CSV, XLS, and XLSX.
 */
export class SpreadsheetAnalyzer extends BaseAnalyzer {
  /**
   * Analyzes the given file and extracts metadata based on the specified options.
   *
   * @param filepath - The file path of the file to be analyzed.
   * @param options - Optional configuration for analysis.
   * @return A promise that resolves to the metadata of the analyzed spreadsheet.
   */
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
    const data: string[][] = [];
    const sampleLimit = opts.sampleSize ?? SIZE_LIMITS.CSV_SAMPLE_SIZE;

    await withTimeout(
      new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(filepath);
        stream
          .pipe(csvParser())
          .on('headers', (hdrs: string[]) => {
            columns = hdrs;
            columnCount = hdrs.length;
            data.push(hdrs);
          })
          .on('data', (da) => {
            rowCount++;
            if (opts.extractData || rowCount <= sampleLimit) {
              data.push(da);
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
      data: opts.extractData || sampleLimit > 0 ? [data] : undefined,
    };
  }

  /**
   * Analyzes an Excel file and extracts spreadsheet metadata.
   * Supports both .xls and .xlsx file formats.
   *
   * @param filepath The file path to the Excel file to be analyzed.
   * @param opts The configuration options required for analysis.
   * @return A promise that resolves to the metadata of the analyzed spreadsheet.
   */
  private async analyzeExcel(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<SpreadsheetMetadata> {
    const ext = path.extname(filepath).toLowerCase();
    if (ext === '.xls') {
      return this.analyzeXls(filepath, opts);
    }

    // Default to xlsx
    return this.analyzeXlsx(filepath, opts);
  }

  /**
   * Analyzes the content of an Excel file and extracts metadata such as sheet information,
   * row and column counts, and other properties.
   *
   * @param filepath The file path of the Excel (.xls/.xlsx) file to analyze.
   * @param opts The analyzer options, specifying configurations such as sample size and content skipping.
   * @return An object containing metadata about the spreadsheet, including sheets information, row count, column count, and other properties.
   */
  private async analyzeXls(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<SpreadsheetMetadata> {
    const wb = XLSX.read(await fs.promises.readFile(filepath), {
      cellDates: true,
    });

    const sheets: SheetInfo[] = [];
    let totalRows = 0;
    let maxCols = 0;
    const sampleLimit = opts.sampleSize ?? SIZE_LIMITS.EXCEL_SAMPLE_SIZE;
    const data: string[][][] = [];

    wb.SheetNames.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      if (!ws || !ws['!ref']) {
        // Skip empty or invalid sheets
        return;
      }

      const sheetData: string[][] = [];
      const range = XLSX.utils.decode_range(ws['!ref']);

      const columns = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        range: 0,
      })[0] as string[];
      const colsCount = columns?.length || 0;

      if (sampleLimit > 0 || opts.extractData) {
        // loop through all data
        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: string[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = ws[XLSX.utils.encode_cell({ r, c })];
            if (cell) {
              const cellValue = cell.v;
              if (cellValue !== null && cellValue !== undefined) {
                row.push(cellValue.toString());
              }
            }
          }
          sheetData.push(row);
          // Skip data if not needed
          if (!opts.extractData && sheetData.length >= sampleLimit) {
            break;
          }
        }
      }

      const rows = range.e.r - range.s.r + 1;
      data.push(sheetData);
      sheets.push({
        name: sheetName,
        rowCount: rows,
        columnCount: colsCount,
        columns: columns || [],
      });
      totalRows += rows;
      maxCols = Math.max(maxCols, colsCount);
    });

    return {
      rowCount: totalRows,
      columnCount: maxCols,
      columns: sheets[0]?.columns || [],
      sheetCount: sheets.length,
      sheets,
      data: opts.extractData || sampleLimit > 0 ? data : undefined,
      hasFormulas: false, // Skipped for performance
    };
  }

  /**
   * Analyzes the provided XLSX file and extracts metadata such as sheet details,
   * row and column counts, and more.
   *
   * @param filepath The path to the XLSX file to be analyzed.
   * @param opts The options required for analysis, including sample size, timeout, and other configurations.
   * @return A promise that resolves with metadata about the spreadsheet, including row and column counts, sheet information, and other details.
   */
  private async analyzeXlsx(
    filepath: string,
    opts: Required<AnalyzerOptions>,
  ): Promise<SpreadsheetMetadata> {
    const wb = new exceljs.Workbook();

    const sheets: SheetInfo[] = [];
    let totalRows = 0;
    let maxCols = 0;
    const sampleLimit = opts.sampleSize ?? SIZE_LIMITS.EXCEL_SAMPLE_SIZE;
    const data: string[][][] = [];

    await withTimeout(
      new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(filepath);
        wb.xlsx
          .read(stream)
          .then(async () => {
            wb.eachSheet((ws) => {
              let rows = 0;
              const columns: string[] = [];
              let colsCount = 0;
              const sheetData: string[][] = [];

              ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                rows++;

                if (opts.extractData || rows <= sampleLimit) {
                  const rowValues: string[] = [];
                  row.eachCell({ includeEmpty: false }, (cell) => {
                    const cellValue = cell.value;
                    if (cellValue !== null && cellValue !== undefined) {
                      rowValues.push(cellValue.toString());
                    }
                  });
                  sheetData.push(rowValues);
                }

                if (rowNumber === 1) {
                  const columns: string[] = [];
                  row.eachCell({ includeEmpty: false }, (cell) => {
                    const cellValue = cell.value;
                    if (cellValue !== null && cellValue !== undefined) {
                      columns.push(cellValue.toString());
                    }
                  });

                  colsCount = columns.length;
                } else {
                  colsCount = Math.max(colsCount, row.cellCount || 0);
                }
              });

              data.push(sheetData);
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
      data: opts.extractData || sampleLimit > 0 ? data : undefined,
      hasFormulas: false, // Skipped for performance
    };
  }

  /**
   * Retrieves the list of supported MIME types for spreadsheet-related files.
   *
   * @return A string array containing the supported MIME types.
   */
  getSupportedMimeTypes(): string[] {
    return MIME_CATEGORIES.SPREADSHEET as unknown as string[];
  }
}
