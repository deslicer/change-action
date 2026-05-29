import * as exec from '@actions/exec';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CLI_REPO_NAME, CLI_REPO_OWNER, RELEASE_WORKFLOW_PATH } from './constants';
import { ensureCosign } from './cosign';
import { artifactName, binaryFileName, rustTarget } from './platform';
import type { InstalledBinary, ResolvedRelease } from './types';
import { tempExtractDir } from './cache';

function releaseDownloadBase(tag: string): string {
  return `https://github.com/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/releases/download/${tag}`;
}

async function downloadUrl(url: string, dest: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Download failed ${url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(dest, buffer);
}

export async function verifySha256File(archivePath: string, shaPath: string): Promise<void> {
  const expectedLine = (await fs.readFile(shaPath, 'utf8')).trim();
  const [expectedHash] = expectedLine.split(/\s+/);
  if (!expectedHash || expectedHash.length !== 64) {
    throw new Error(`Invalid sha256 sidecar at ${shaPath}`);
  }
  const actual = crypto.createHash('sha256').update(await fs.readFile(archivePath)).digest('hex');
  if (actual !== expectedHash.toLowerCase()) {
    throw new Error('SHA-256 checksum mismatch for deslicer CLI archive');
  }
}

export async function verifyCosignSignature(
  archivePath: string,
  sigPath: string,
  tag: string,
): Promise<void> {
  const cosign = await ensureCosign();
  const identity = `${RELEASE_WORKFLOW_PATH}${tag}`;
  const code = await exec.exec(
    cosign,
    [
      'verify-blob',
      `--certificate-identity=${identity}`,
      '--certificate-oidc-issuer=https://token.actions.githubusercontent.com',
      `--signature=${sigPath}`,
      archivePath,
    ],
    { ignoreReturnCode: true },
  );
  if (code !== 0) {
    throw new Error('cosign signature verification failed for deslicer CLI archive');
  }
}

async function extractArchive(archivePath: string, destDir: string, platform: NodeJS.Platform): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  if (archivePath.endsWith('.zip')) {
    if (process.platform === 'win32') {
      await exec.exec(
        'powershell',
        ['-NoProfile', '-Command', `Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force`],
      );
    } else {
      await exec.exec('unzip', ['-o', archivePath, '-d', destDir]);
    }
    return;
  }
  await exec.exec('tar', ['-xzf', archivePath, '-C', destDir]);
  void platform;
}

export async function downloadAndVerify(
  release: ResolvedRelease,
  platform: NodeJS.Platform,
  arch: string,
): Promise<InstalledBinary> {
  const target = rustTarget(platform, arch);
  const artifact = artifactName(target);
  const base = releaseDownloadBase(release.tag);
  const workDir = tempExtractDir();
  await fs.mkdir(workDir, { recursive: true });

  const archivePath = path.join(workDir, artifact);
  const shaPath = `${archivePath}.sha256`;
  const sigPath = `${archivePath}.sig`;

  await downloadUrl(`${base}/${artifact}`, archivePath);
  await downloadUrl(`${base}/${artifact}.sha256`, shaPath);
  await downloadUrl(`${base}/${artifact}.sig`, sigPath);

  await verifySha256File(archivePath, shaPath);
  await verifyCosignSignature(archivePath, sigPath, release.tag);

  const extractDir = path.join(workDir, 'extract');
  await extractArchive(archivePath, extractDir, platform);

  const binaryName = binaryFileName(platform);
  const full = path.join(extractDir, binaryName);
  try {
    await fs.access(full);
  } catch {
    throw new Error(`Extracted archive did not contain ${binaryName}`);
  }

  if (platform !== 'win32') {
    await fs.chmod(full, 0o755);
  }

  return { dir: extractDir, full };
}
