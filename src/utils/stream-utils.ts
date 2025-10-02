import { once } from 'node:events';
import { createReadStream } from 'node:fs';
import readline from 'node:readline';
import { STREAM_DEFAULTS } from '../constants.js';

export async function createSafeReadStream(
  filepath: string,
  options?: { start?: number; end?: number },
): Promise<NodeJS.ReadableStream> {
  const stream = createReadStream(filepath, {
    start: options?.start,
    end: options?.end,
    highWaterMark: STREAM_DEFAULTS.chunkSize,
  });
  return stream;
}

export async function countLines(filepath: string): Promise<number> {
  const stream = await createSafeReadStream(filepath);
  const rl = readline.createInterface({ input: stream });
  let count = 0;
  rl.on('line', () => {
    count += 1;
  });
  await once(rl, 'close');
  return count;
}

export async function readFirstChunk(
  filepath: string,
  bytes: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filepath, { start: 0, end: bytes - 1 });
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function processFileInChunks(
  filepath: string,
  chunkSize: number,
  processor: (chunk: Buffer) => void | Promise<void>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filepath, { highWaterMark: chunkSize });
    stream.on('data', async (chunk) => {
      try {
        await processor(Buffer.from(chunk));
      } catch (e) {
        stream.destroy();
        reject(e);
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve());
  });
}

export async function sampleCsvRows(
  filepath: string,
  sampleSize: number,
): Promise<string[][]> {
  // Lightweight line-based sampler; not RFC-complete CSV parsing
  const rows: string[][] = [];
  const stream = await createSafeReadStream(filepath);
  const rl = readline.createInterface({ input: stream });
  for await (const line of rl) {
    // naive split on comma; suitable only as a placeholder
    rows.push(line.split(','));
    if (rows.length >= sampleSize) break;
  }
  rl.close();
  return rows;
}
