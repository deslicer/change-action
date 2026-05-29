import * as tc from '@actions/tool-cache';
import * as os from 'node:os';
import * as path from 'node:path';
import type { InstalledBinary } from './types';

const CACHE_PREFIX = 'deslicer-cli';

export async function cacheBinary(
  binaryPath: string,
  semver: string,
): Promise<InstalledBinary> {
  const fileName = path.basename(binaryPath);
  const cachedPath = await tc.cacheFile(binaryPath, fileName, `${CACHE_PREFIX}-${semver}`, semver);
  return { dir: path.dirname(cachedPath), full: cachedPath };
}

export function tempExtractDir(): string {
  return path.join(os.tmpdir(), `deslicer-action-${process.pid}`);
}
