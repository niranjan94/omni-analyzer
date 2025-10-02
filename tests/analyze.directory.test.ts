import path from "node:path";
import { describe, expect, it } from "vitest";
import { FileAnalyzer } from "@/index.js";

function dataPath(...p: string[]) {
	return path.join(import.meta.dirname, "data", ...p);
}

describe("Directory analysis", () => {
	it("analyzes images directory (non-recursive) and snapshots specific metadata list", async () => {
		const analyzer = new FileAnalyzer();
		const dir = dataPath("images");
		const results = await analyzer.analyzeDirectory(dir, { recursive: false });
		const simplified = results
			.map((r) => ({
				filename: r.base.filename,
				specific: r.specific,
			}))
			.sort((a, b) => a.filename.localeCompare(b.filename));
		expect(simplified).toMatchSnapshot();
	});

	it("analyzes text directory and snapshots metadata list", async () => {
		const analyzer = new FileAnalyzer();
		const dir = dataPath("text");
		const results = await analyzer.analyzeDirectory(dir, { recursive: false });
		const simplified = results
			.map((r) => ({
				filename: r.base.filename,
				specific: r.specific,
			}))
			.sort((a, b) => a.filename.localeCompare(b.filename));
		expect(simplified).toMatchSnapshot();
	});
});
