import { describe } from "vitest";
import { DocumentAnalyzer } from "@/analyzers/document-analyzer.js";
import { testAnalyzer } from "@/tests/base.js";

describe("DocumentAnalyzer", () =>
	testAnalyzer(new DocumentAnalyzer(), "documents"));
