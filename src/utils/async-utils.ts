import { AnalysisTimeoutError } from '@/types.js';

/**
 * Executes a promise and enforces a timeout. The function ensures that
 * the promise either resolves or rejects within the specified timeout period.
 *
 * @param promise The promise to execute.
 * @param timeout The maximum time in milliseconds to wait before rejecting the promise.
 * @return A promise that resolves with the resolved value of the input promise,
 * or rejects with a timeout error if the duration exceeds the specified timeout.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  return await Promise.race([
    promise.finally(() => timer && clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(
        () => reject(new AnalysisTimeoutError(timeout)),
        timeout,
      );
    }),
  ]);
}
