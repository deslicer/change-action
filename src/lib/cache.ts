import * as tc from '@actions/tool-cache';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { InstalledBinary } from './types';

const CACHE_PREFIX = 'deslicer-cli';

export async function cacheBinary(
  binaryPath: string,
  semver: string,
): Promise<InstalledBinary> {
  const fileName = path.basename(binaryPath);
  // tc.cacheFile returns the destination DIRECTORY (.../<tool>/<version>/<arch>),
  // not the cached file path. Join the file name to get the executable.
  const cachedDir = await tc.cacheFile(binaryPath, fileName, `${CACHE_PREFIX}-${semver}`, semver);
  const full = path.join(cachedDir, fileName);
  if (process.platform !== 'win32') {
    await fs.chmod(full, 0o755);
  }
  return { dir: cachedDir, full };
}

export function tempExtractDir(): string {
  return path.join(os.tmpdir(), `deslicer-action-${process.pid}`);
}
