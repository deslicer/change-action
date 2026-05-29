import { artifactName, binaryFileName, rustTarget } from '../src/lib/platform';

describe('platform', () => {
  it('maps linux x64 to musl target', () => {
    expect(rustTarget('linux', 'x64')).toBe('x86_64-unknown-linux-musl');
    expect(artifactName('x86_64-unknown-linux-musl')).toBe(
      'deslicer-x86_64-unknown-linux-musl.tar.gz',
    );
  });

  it('maps windows x64 to zip artifact', () => {
    expect(rustTarget('win32', 'x64')).toBe('x86_64-pc-windows-msvc');
    expect(artifactName('x86_64-pc-windows-msvc')).toBe('deslicer-x86_64-pc-windows-msvc.zip');
    expect(binaryFileName('win32')).toBe('deslicer.exe');
  });

  it('rejects unsupported windows arm64', () => {
    expect(() => rustTarget('win32', 'arm64')).toThrow(/No deslicer release built/);
  });
});
