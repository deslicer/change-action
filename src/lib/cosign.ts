import * as tc from '@actions/tool-cache';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { COSIGN_VERSION } from './constants';

function cosignAssetName(platform: NodeJS.Platform, arch: string): string {
  if (platform === 'win32') {
    return 'cosign-windows-amd64.exe';
  }
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'cosign-darwin-arm64' : 'cosign-darwin-amd64';
  }
  return arch === 'arm64' ? 'cosign-linux-arm64' : 'cosign-linux-amd64';
}

function installedName(platform: NodeJS.Platform): string {
  return platform === 'win32' ? 'cosign.exe' : 'cosign';
}

export async function ensureCosign(): Promise<string> {
  const cacheKey = `cosign-${COSIGN_VERSION}`;
  const hit = tc.find('cosign', cacheKey, COSIGN_VERSION);
  if (hit) {
    return hit;
  }

  const asset = cosignAssetName(process.platform, process.arch);
  const url = `https://github.com/sigstore/cosign/releases/download/v${COSIGN_VERSION}/${asset}`;
  const downloadPath = await tc.downloadTool(url);
  const target = path.join(path.dirname(downloadPath), installedName(process.platform));
  await fs.rename(downloadPath, target);
  if (process.platform !== 'win32') {
    await fs.chmod(target, 0o755);
  }
  return tc.cacheFile(target, path.basename(target), cacheKey, COSIGN_VERSION);
}
