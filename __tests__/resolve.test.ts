import {
  fetchLatestRelease,
  fetchReleaseByTag,
  listReleases,
  resolveTagCommitSha,
} from '../src/lib/github-api';
import { resolveRelease } from '../src/lib/resolve';

jest.mock('../src/lib/github-api');

const mockedFetchLatest = jest.mocked(fetchLatestRelease);
const mockedFetchByTag = jest.mocked(fetchReleaseByTag);
const mockedList = jest.mocked(listReleases);
const mockedTagSha = jest.mocked(resolveTagCommitSha);

describe('resolveRelease', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('resolves floating v1 from latest release', async () => {
    mockedFetchLatest.mockResolvedValue({ tag_name: 'v1.0.0', target_commitish: 'abc' });
    mockedTagSha.mockResolvedValue('abc123def4567890abc123def4567890abc123de');

    const release = await resolveRelease('v1');
    expect(release.tag).toBe('v1.0.0');
    expect(release.semver).toBe('1.0.0');
  });

  it('resolves immutable semver tag', async () => {
    mockedFetchByTag.mockResolvedValue({ tag_name: 'v1.0.0', target_commitish: 'abc' });
    mockedTagSha.mockResolvedValue('abc123def4567890abc123def4567890abc123de');

    const release = await resolveRelease('v1.0.0');
    expect(release.semver).toBe('1.0.0');
  });

  it('resolves unique release tag for commit sha', async () => {
    const sha = 'abc123def4567890abc123def4567890abc123de';
    mockedList.mockResolvedValue([
      { tag_name: 'v1.0.0', target_commitish: sha },
      { tag_name: 'v0.9.0', target_commitish: 'other' },
    ]);
    mockedTagSha.mockImplementation(async (tag) => (tag === 'v1.0.0' ? sha : 'other'));

    const release = await resolveRelease(sha);
    expect(release.tag).toBe('v1.0.0');
  });

  it('fails when floating latest is not v1 line', async () => {
    mockedFetchLatest.mockResolvedValue({ tag_name: 'v2.0.0', target_commitish: 'abc' });
    await expect(resolveRelease('v1')).rejects.toThrow(/expected a v1\.x\.y/);
  });
});
