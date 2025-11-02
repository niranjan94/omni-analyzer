import fs from 'node:fs/promises';
import path from 'node:path';
import { detectMimeType } from '@/utils/file-utils.js';

export function dataPath(...p: string[]) {
  return path.join(import.meta.dirname, 'data', ...p);
}

export async function getSampleFiles(
  subdir: string,
): Promise<[string, string][]> {
  const dir = dataPath(subdir);
  return (
    await Promise.all(
      (
        await fs.readdir(dir)
      ).map(async (f) => {
        if (f.startsWith('.')) {
          return null;
        }
        const filePath = path.join(dir, f);
        const mimeType = await detectMimeType(filePath);
        return [`${f} (${mimeType})`, filePath];
      }),
    )
  ).filter((it) => !!it) as [string, string][];
}
