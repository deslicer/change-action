const setSecret = jest.fn();
const exportVariable = jest.fn();
const setOutput = jest.fn();
const addPath = jest.fn();
const setFailed = jest.fn();
const inputs: Record<string, string> = {};

jest.mock('@actions/core', () => ({
  getInput: (name: string) => inputs[name] ?? '',
  info: jest.fn(),
  setSecret,
  exportVariable,
  setOutput,
  addPath,
  setFailed,
}));

jest.mock('@actions/exec', () => ({
  exec: jest.fn().mockResolvedValue(0),
}));

jest.mock('../src/lib/resolve', () => ({
  resolveRelease: jest.fn().mockResolvedValue({
    semver: '1.2.3',
    sha: 'a'.repeat(40),
    tag: 'v1.2.3',
  }),
}));

jest.mock('../src/lib/download', () => ({
  downloadAndVerify: jest.fn().mockResolvedValue({ full: '/tmp/deslicer' }),
}));

jest.mock('../src/lib/cache', () => ({
  cacheBinary: jest.fn().mockResolvedValue({ dir: '/tool/dir', full: '/tool/dir/deslicer' }),
}));

async function runAction(): Promise<void> {
  jest.resetModules();
  await import('../src/index');
  // main() is fire-and-forget on module load; let its promise chain settle.
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

describe('api-token input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(inputs)) {
      delete inputs[key];
    }
  });

  it('masks the token and exports DESLICER_API_TOKEN when api-token is set', async () => {
    inputs['api-token'] = 'obs-secret-token';

    await runAction();

    expect(setSecret).toHaveBeenCalledWith('obs-secret-token');
    expect(exportVariable).toHaveBeenCalledWith('DESLICER_API_TOKEN', 'obs-secret-token');
    // Masking must happen before the value is exported into the env.
    expect(setSecret.mock.invocationCallOrder[0]).toBeLessThan(
      exportVariable.mock.invocationCallOrder[
        exportVariable.mock.calls.findIndex((c) => c[0] === 'DESLICER_API_TOKEN')
      ],
    );
  });

  it('does not export DESLICER_API_TOKEN when api-token is empty', async () => {
    await runAction();

    expect(setSecret).not.toHaveBeenCalled();
    expect(exportVariable).not.toHaveBeenCalledWith('DESLICER_API_TOKEN', expect.anything());
  });

  it('still exports OBSERVER_API_URL independently of the token', async () => {
    inputs['observer-api-url'] = 'https://api.deslicer.ai';

    await runAction();

    expect(exportVariable).toHaveBeenCalledWith('OBSERVER_API_URL', 'https://api.deslicer.ai');
    expect(exportVariable).not.toHaveBeenCalledWith('DESLICER_API_TOKEN', expect.anything());
  });
});
