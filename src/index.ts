import fs from "node:fs/promises";
import path from "node:path";

import { DEFAULT_OPTIONS } from "./constants.js";
import { AnalyzerRegistry } from "./registry/analyzer-registry.js";
import type {
	AnalyzerOptions,
	BaseAnalyzer,
	BaseFileMetadata,
	FileAnalysisResult,
} from "./types.js";
import {
	detectMimeType,
	getFileStats,
	isFileSizeValid,
	validateFilePath as validateFsPath,
} from "./utils/file-utils.js";

export class FileAnalyzer {
	private registry: AnalyzerRegistry;
	private options: Required<AnalyzerOptions>;

	constructor(options: AnalyzerOptions = {}) {
		this.registry = AnalyzerRegistry.getInstance();
		this.options = {
			...DEFAULT_OPTIONS,
			...options,
		} as Required<AnalyzerOptions>;
	}

	async analyzeFile(
		filepath: string,
		options?: AnalyzerOptions,
	): Promise<FileAnalysisResult> {
		const start = Date.now();
		const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;
		try {
			await validateFsPath(filepath);
			const baseMetadata: BaseFileMetadata = await getFileStats(filepath);
			if (!isFileSizeValid(baseMetadata.size, merged.maxFileSize)) {
				throw new Error("File size exceeds limit");
			}

			const mimeType = await detectMimeType(filepath);
			baseMetadata.mimeType = mimeType;

			const analyzer = this.registry.getAnalyzer(
				mimeType || "application/octet-stream",
			);
			const specific = await this.withTimeout(
				analyzer.analyze(filepath, merged),
				merged.timeout,
			);

			return {
				base: baseMetadata,
				specific,
				analysisTime: Date.now() - start,
			};
		} catch (error) {
			if (!merged.failSilent) {
				throw error;
			}
			const base = await getFileStats(filepath).catch(
				() =>
					({
						filename: filepath.split("/").pop() || filepath,
						filepath,
						size: 0,
						sizeFormatted: "0 B",
						extension: "",
						mimeType: null,
						createdAt: new Date(0),
						modifiedAt: new Date(0),
						accessedAt: new Date(0),
					}) as BaseFileMetadata,
			);
			return {
				base,
				specific: {},
				analysisTime: Date.now() - start,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async analyzeFiles(
		filepaths: string[],
		options?: AnalyzerOptions & { concurrency?: number },
	): Promise<FileAnalysisResult[]> {
		const concurrency = options?.concurrency ?? 5;
		const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;

		const results: FileAnalysisResult[] = [];
		let index = 0;

		async function worker(thisRef: FileAnalyzer) {
			while (true) {
				const i = index++;
				if (i >= filepaths.length) break;
				const fp = filepaths[i];
				results[i] = await thisRef.analyzeFile(fp, merged); // preserve order
			}
		}

		const workers = Array.from(
			{ length: Math.min(concurrency, filepaths.length) },
			() => worker(this),
		);
		await Promise.all(workers);
		return results;
	}

	async analyzeDirectory(
		dirpath: string,
		options?: AnalyzerOptions & {
			recursive?: boolean;
			filter?: (filename: string) => boolean;
		},
	): Promise<FileAnalysisResult[]> {
		const recursive = options?.recursive ?? false;
		const filter = options?.filter as ((f: string) => boolean) | undefined;

		const files: string[] = [];

		const walk = async (dir: string) => {
			const entries = await fs.readdir(dir, { withFileTypes: true });
			for (const ent of entries) {
				const full = path.join(dir, ent.name);
				if (ent.isFile()) {
					if (!filter || filter(ent.name)) files.push(full);
				} else if (recursive && ent.isDirectory()) {
					await walk(full);
				}
			}
		};

		await walk(dirpath);
		return this.analyzeFiles(files, options);
	}

	registerAnalyzer(mimeTypes: string[], analyzer: BaseAnalyzer): void {
		this.registry.registerCustomAnalyzer(mimeTypes, analyzer);
	}

	private async withTimeout<T>(
		promise: Promise<T>,
		timeout: number,
	): Promise<T> {
		let timer: NodeJS.Timeout | undefined;
		return await Promise.race([
			promise.finally(() => timer && clearTimeout(timer)),
			new Promise<T>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error(`Analysis timeout after ${timeout}ms`)),
					timeout,
				);
			}),
		]);
	}
}

export async function analyzeFile(
	filepath: string,
	options?: AnalyzerOptions,
): Promise<FileAnalysisResult> {
	const analyzer = new FileAnalyzer(options);
	return analyzer.analyzeFile(filepath, options);
}
