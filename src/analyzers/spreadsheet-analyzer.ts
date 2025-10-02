import fs from "node:fs";
import path from "node:path";
import csvParser from "csv-parser";
import { default as exceljs } from "exceljs";
import * as XLSX from "xlsx";
import { MIME_CATEGORIES, SIZE_LIMITS } from "../constants.js";
import type {
	AnalyzerOptions,
	SheetInfo,
	SpreadsheetMetadata,
} from "../types.js";
import { BaseAnalyzer } from "./base-analyzer.js";

export class SpreadsheetAnalyzer extends BaseAnalyzer {
	async analyze(
		filepath: string,
		options?: AnalyzerOptions,
	): Promise<SpreadsheetMetadata> {
		await this.validateFile(filepath);
		const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

		const ext = path.extname(filepath).toLowerCase();
		if (ext === ".csv") {
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
					.on("headers", (hdrs: string[]) => {
						columns = hdrs;
						columnCount = hdrs.length;
					})
					.on("data", () => {
						rowCount++;
						if (rowCount >= sampleLimit && opts.skipContent) {
							stream.destroy();
						}
					})
					.on("error", (err) => reject(err))
					.on("close", () => resolve())
					.on("end", () => resolve());
			}),
			opts.timeout,
		);

		const sheets: SheetInfo[] = [
			{
				name: "CSV",
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
		const ext = path.extname(filepath).toLowerCase();
		if (ext === ".xls") {
			return this.analyzeXls(filepath, opts);
		}

		// Default to xlsx
		return this.analyzeXlsx(filepath, opts);
	}

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

		wb.SheetNames.forEach((sheetName) => {
			const ws = wb.Sheets[sheetName];
			if (!ws || !ws["!ref"]) {
				// Skip empty or invalid sheets
				return;
			}

			const range = XLSX.utils.decode_range(ws["!ref"]);

			const columns = XLSX.utils.sheet_to_json(ws, {
				header: 1,
				range: 0,
			})[0] as string[];
			const colsCount = columns?.length || 0;

			let rows = range.e.r - range.s.r + 1;
			if (opts.skipContent) {
				rows = Math.min(rows, sampleLimit);
			}

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
			hasFormulas: false, // Skipped for performance
		};
	}

	private async analyzeXlsx(
		filepath: string,
		opts: Required<AnalyzerOptions>,
	): Promise<SpreadsheetMetadata> {
		const wb = new exceljs.Workbook();

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
										typeof row.values?.slice === "function"
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
