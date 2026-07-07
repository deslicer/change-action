import { resolveTagCommitSha } from '../src/lib/github-api';

describe('resolveTagCommitSha', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.GITHUB_TOKEN = 'ghs_test_token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GITHUB_TOKEN;
  });

  it('sends Authorization when peeling an annotated tag', async () => {
    const peelUrl = 'https://api.github.com/repos/deslicer/cli/git/tags/abc123';
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: {
            type: 'tag',
            sha: 'tagsha',
            url: peelUrl,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: { sha: 'commitsha'.padEnd(40, '0') },
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    const sha = await resolveTagCommitSha('v1.0.0');

    expect(sha).toBe('commitsha'.padEnd(40, '0'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual({
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: 'Bearer ghs_test_token',
      },
    });
  });
});
