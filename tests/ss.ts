import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeFile } from "@/index.js";
import { getSampleFiles } from "@/tests/utils.js";

describe("Text-like files", () => {
	const samples = getSampleFiles("text");
	it.for(samples)(`analyzes %s as text`, async ([_, fp]) => {
		const res = await analyzeFile(fp);
		// Normalize volatile fields (analysisTime varies; filepath absolute).
		const normalized = {
			base: {
				...res.base,
				filepath: path.basename(res.base.filepath),
			},
			specific: res.specific,
			analysisTime: 0,
			error: res.error,
		};
		expect(normalized.specific).toMatchSnapshot();
		// Also snapshot selected stable base fields for sanity
		expect({
			filename: normalized.base.filename,
			extension: normalized.base.extension,
			size: normalized.base.size,
			mimeType: normalized.base.mimeType,
		}).toMatchSnapshot();
	});
});
