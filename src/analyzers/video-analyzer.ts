import * as ffmpeg from "fluent-ffmpeg";
import { MIME_CATEGORIES } from "../constants.js";
import type { AnalyzerOptions, VideoMetadata } from "../types.js";
import { formatDuration } from "../utils/file-utils.js";
import { BaseAnalyzer } from "./base-analyzer.js";

export class VideoAnalyzer extends BaseAnalyzer {
	async analyze(
		filepath: string,
		options?: AnalyzerOptions,
	): Promise<VideoMetadata> {
		await this.validateFile(filepath);
		const merged = { ...this.options, ...options } as Required<AnalyzerOptions>;
		const probe = await this.withTimeout(
			new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
				try {
					ffmpeg.default.ffprobe(filepath, (err, data) =>
						err ? reject(err) : resolve(data),
					);
				} catch (err) {
					reject(err);
				}
			}),
			merged.timeout,
		);

		// Extract streams info
		const streams = probe.streams || [];
		const format = probe.format || {};

		const videoStream = streams.find((s) => s.codec_type === "video");
		const audioStream = streams.find((s) => s.codec_type === "audio");
		const subtitleStream = streams.find((s) => s.codec_type === "subtitle");

		const width = Number(videoStream?.width || 0);
		const height = Number(videoStream?.height || 0);
		const fps = (() => {
			const r =
				videoStream?.avg_frame_rate || videoStream?.r_frame_rate || "0/1";
			const [num, den] = String(r)
				.split("/")
				.map((x: string) => Number(x) || 0);
			return den ? Number((num / den).toFixed(3)) : 0;
		})();

		const durationSec = Number(format.duration || videoStream?.duration || 0);
		const bitRate = Number(format.bit_rate || videoStream?.bit_rate || 0);

		return {
			duration: durationSec,
			durationFormatted: formatDuration(durationSec),
			width,
			height,
			resolution: `${width}x${height}`,
			frameRate: fps,
			codec: String(videoStream?.codec_name || ""),
			bitrate: bitRate,
			audioCodec: audioStream?.codec_name || undefined,
			hasAudio: Boolean(audioStream),
			hasSubtitles: Boolean(subtitleStream),
		};
	}

	getSupportedMimeTypes(): string[] {
		return MIME_CATEGORIES.VIDEO as unknown as string[];
	}
}
