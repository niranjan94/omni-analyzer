import { promises as fs } from "node:fs";
import path from "node:path";
import { FILE_SIZE_UNITS } from "../constants.js";
import type { BaseFileMetadata } from "../types.js";

export async function getFileStats(
	filepath: string,
): Promise<BaseFileMetadata> {
	const stats = await fs.stat(filepath);
	const filename = path.basename(filepath);
	const extension = getFileExtension(filepath);
	return {
		filename,
		filepath,
		size: stats.size,
		sizeFormatted: formatFileSize(stats.size),
		extension,
		mimeType: null,
	};
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const value = bytes / k ** i;
	const unit = FILE_SIZE_UNITS[i] || "B";
	return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${unit}`;
}

export async function validateFilePath(filepath: string): Promise<void> {
	try {
		await fs.access(filepath);
		const stats = await fs.stat(filepath);
		if (!stats.isFile()) {
			throw new Error("Path is not a file");
		}
	} catch (e) {
		throw new Error(`File not accessible: ${filepath}`);
	}
}

export function getFileExtension(filepath: string): string {
	return path.extname(filepath).replace(/^\./, "").toLowerCase();
}

export function isFileSizeValid(size: number, maxSize: number): boolean {
	return size <= maxSize;
}

export function formatDuration(seconds: number): string {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	const hh = String(hrs).padStart(2, "0");
	const mm = String(mins).padStart(2, "0");
	const ss = String(secs).padStart(2, "0");
	return `${hh}:${mm}:${ss}`;
}

export function calculateAspectRatio(width: number, height: number): string {
	if (width === 0 || height === 0) return "0:0";
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const g = gcd(width, height);
	return `${Math.round(width / g)}:${Math.round(height / g)}`;
}
