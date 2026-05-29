import { cosignBinaryPath } from '../src/lib/cosign';

describe('cosignBinaryPath', () => {
  it('appends cosign on unix', () => {
    expect(cosignBinaryPath('/cache/cosign/2.4.1/x64', 'linux')).toBe('/cache/cosign/2.4.1/x64/cosign');
  });

  it('appends cosign.exe on windows', () => {
    expect(cosignBinaryPath('C:\\cache\\cosign\\2.4.1\\x64', 'win32')).toBe(
      'C:\\cache\\cosign\\2.4.1\\x64\\cosign.exe',
    );
  });
});
