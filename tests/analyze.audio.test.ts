import { describe } from "vitest";
import { AudioAnalyzer } from "@/analyzers/audio-analyzer.js";
import { testAnalyzer } from "@/tests/base.js";

describe("AudioAnalyzer", () => testAnalyzer(new AudioAnalyzer(), "audio"));
