import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { cacheBinary } from './lib/cache';
import { downloadAndVerify } from './lib/download';
import { resolveRelease } from './lib/resolve';

function parseCommandArgs(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed.split(/\s+/);
}

async function runDeslicerChange(binaryPath: string, command: string, args: string[]): Promise<void> {
  const argv = ['change', command, ...args];
  core.info(`Running: deslicer ${argv.join(' ')}`);
  const code = await exec.exec(binaryPath, argv, {
    ignoreReturnCode: true,
  });
  if (code !== 0) {
    core.setFailed(`deslicer change ${command} exited with code ${code}`);
  }
}

async function main(): Promise<void> {
  const version = core.getInput('version') || 'v1';
  const versionSha = core.getInput('version-sha');
  const command = core.getInput('command');
  const commandArgs = parseCommandArgs(core.getInput('command-args'));
  const observerApiUrl = core.getInput('observer-api-url');

  const release = await resolveRelease(versionSha || version);
  core.info(`Resolved deslicer ${release.semver} (${release.sha.slice(0, 7)}) from tag ${release.tag}`);

  const installed = await downloadAndVerify(release, process.platform, process.arch);
  const cached = await cacheBinary(installed.full, release.semver);
  core.addPath(cached.dir);

  if (observerApiUrl) {
    core.exportVariable('OBSERVER_API_URL', observerApiUrl);
  }

  core.setOutput('cli-version', release.semver);
  core.setOutput('cli-path', cached.full);

  if (command) {
    await runDeslicerChange(cached.full, command, commandArgs);
  } else {
    const code = await exec.exec(cached.full, ['--version'], { ignoreReturnCode: true });
    if (code !== 0) {
      core.setFailed('deslicer --version failed after install');
    }
  }
}

main().catch((err: unknown) => {
  if (err instanceof Error) {
    core.setFailed(err.stack ?? err.message);
  } else {
    core.setFailed(String(err));
  }
});
