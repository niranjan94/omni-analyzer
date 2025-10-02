import { describe } from "vitest";
import { ArchiveAnalyzer } from "@/analyzers/archive-analyzer.js";
import { testAnalyzer } from "@/tests/base.js";

describe("ArchiveAnalyzer", () =>
	testAnalyzer(new ArchiveAnalyzer(), "archives"));
