import * as tc from '@actions/tool-cache';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { COSIGN_VERSION } from './constants';

const COSIGN_TOOL_NAME = 'cosign';

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

/** find/cacheFile return the tool directory — append the binary file name. */
export function cosignBinaryPath(toolDir: string, platform: NodeJS.Platform = process.platform): string {
  const name = installedName(platform);
  return platform === 'win32' ? path.win32.join(toolDir, name) : path.posix.join(toolDir, name);
}

export async function ensureCosign(): Promise<string> {
  const cachedDir = tc.find(COSIGN_TOOL_NAME, COSIGN_VERSION);
  if (cachedDir) {
    return cosignBinaryPath(cachedDir);
  }

  const asset = cosignAssetName(process.platform, process.arch);
  const url = `https://github.com/sigstore/cosign/releases/download/v${COSIGN_VERSION}/${asset}`;
  const downloadPath = await tc.downloadTool(url);
  const binaryName = installedName(process.platform);
  const target = path.join(path.dirname(downloadPath), binaryName);
  await fs.rename(downloadPath, target);
  if (process.platform !== 'win32') {
    await fs.chmod(target, 0o755);
  }
  const toolDir = await tc.cacheFile(target, binaryName, COSIGN_TOOL_NAME, COSIGN_VERSION);
  return cosignBinaryPath(toolDir);
}
