import { describe } from "vitest";
import { ImageAnalyzer } from "@/analyzers/image-analyzer.js";
import { testAnalyzer } from "@/tests/base.js";

describe("ImageAnalyzer", () => testAnalyzer(new ImageAnalyzer(), "images"));
