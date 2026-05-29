import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { verifySha256File } from '../src/lib/download';

describe('verifySha256File', () => {
  it('accepts matching checksum sidecar', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deslicer-action-test-'));
    const archivePath = path.join(dir, 'deslicer-x86_64-unknown-linux-musl.tar.gz');
    const shaPath = `${archivePath}.sha256`;
    const payload = Buffer.from('test archive');
    await fs.writeFile(archivePath, payload);
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    await fs.writeFile(shaPath, `${hash}  ${path.basename(archivePath)}\n`);
    await expect(verifySha256File(archivePath, shaPath)).resolves.toBeUndefined();
  });

  it('rejects tampered archive', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deslicer-action-test-'));
    const archivePath = path.join(dir, 'deslicer-x86_64-unknown-linux-musl.tar.gz');
    const shaPath = `${archivePath}.sha256`;
    await fs.writeFile(archivePath, Buffer.from('tampered'));
    await fs.writeFile(shaPath, `${'a'.repeat(64)}  ${path.basename(archivePath)}\n`);
    await expect(verifySha256File(archivePath, shaPath)).rejects.toThrow(/SHA-256 checksum mismatch/);
  });
});
