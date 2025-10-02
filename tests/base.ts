import { expect, it } from "vitest";
import type { BaseAnalyzer } from "@/analyzers/base-analyzer.js";
import { getSampleFiles } from "@/tests/utils.js";

export async function testAnalyzer(analyzer: BaseAnalyzer, subdir: string) {
	const samples = await getSampleFiles(subdir);
	const analyzerName = analyzer.constructor.name;

	it.for(samples)(`${analyzerName}: analyzes file %s`, async ([_, fp]) => {
		const specific = await analyzer.analyze(fp, {
			deepAnalysis: true,
			extractText: true,
		});
		// Snapshot outcome regardless of environment: either metadata or error path
		expect(specific).toMatchSnapshot();
	});
}
