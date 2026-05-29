export function rustTarget(platform: NodeJS.Platform, arch: string): string {
  if (platform === 'linux' && arch === 'x64') {
    return 'x86_64-unknown-linux-musl';
  }
  if (platform === 'linux' && arch === 'arm64') {
    return 'aarch64-unknown-linux-musl';
  }
  if (platform === 'darwin' && arch === 'x64') {
    return 'x86_64-apple-darwin';
  }
  if (platform === 'darwin' && arch === 'arm64') {
    return 'aarch64-apple-darwin';
  }
  if (platform === 'win32' && arch === 'x64') {
    return 'x86_64-pc-windows-msvc';
  }
  throw new Error(
    `No deslicer release built for ${platform}-${arch}. ` +
      'Windows arm64 is not published; use windows-latest (x64).',
  );
}

export function artifactName(target: string): string {
  if (target.endsWith('pc-windows-msvc')) {
    return `deslicer-${target}.zip`;
  }
  return `deslicer-${target}.tar.gz`;
}

export function binaryFileName(platform: NodeJS.Platform): string {
  return platform === 'win32' ? 'deslicer.exe' : 'deslicer';
}
