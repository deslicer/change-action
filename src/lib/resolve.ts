import type { ResolvedRelease } from './types';
import {
  fetchLatestRelease,
  fetchReleaseByTag,
  listReleases,
  resolveTagCommitSha,
} from './github-api';

const SHA_RE = /^[0-9a-f]{40}$/i;
const SEMVER_TAG_RE = /^v\d+\.\d+\.\d+(-[\w.]+)?$/;

function semverFromTag(tag: string): string {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

async function releaseFromTag(tag: string): Promise<ResolvedRelease> {
  const release = await fetchReleaseByTag(tag);
  const sha = await resolveTagCommitSha(release.tag_name);
  return {
    tag: release.tag_name,
    semver: semverFromTag(release.tag_name),
    sha,
  };
}

async function resolveFloatingV1(): Promise<ResolvedRelease> {
  const release = await fetchLatestRelease();
  if (!release.tag_name.startsWith('v1.')) {
    throw new Error(
      `Latest deslicer/cli release is ${release.tag_name}, expected a v1.x.y floating-tag line`,
    );
  }
  const sha = await resolveTagCommitSha(release.tag_name);
  return {
    tag: release.tag_name,
    semver: semverFromTag(release.tag_name),
    sha,
  };
}

async function resolveByCommitSha(commitSha: string): Promise<ResolvedRelease> {
  const normalized = commitSha.toLowerCase();
  const releases = await listReleases();
  const matches: ResolvedRelease[] = [];

  for (const release of releases) {
    if (!SEMVER_TAG_RE.test(release.tag_name)) {
      continue;
    }
    const tagSha = await resolveTagCommitSha(release.tag_name);
    if (tagSha.toLowerCase() === normalized) {
      matches.push({
        tag: release.tag_name,
        semver: semverFromTag(release.tag_name),
        sha: tagSha,
      });
    }
  }

  if (matches.length === 0) {
    throw new Error(`No deslicer/cli release tag references commit ${commitSha}`);
  }
  if (matches.length > 1) {
    const tags = matches.map((m) => m.tag).join(', ');
    throw new Error(
      `Commit ${commitSha} is referenced by multiple release tags (${tags}); pin an explicit version tag instead`,
    );
  }
  return matches[0];
}

export async function resolveRelease(versionOrSha: string): Promise<ResolvedRelease> {
  const trimmed = versionOrSha.trim();
  if (SHA_RE.test(trimmed)) {
    return resolveByCommitSha(trimmed);
  }
  if (trimmed === 'v1') {
    return resolveFloatingV1();
  }
  if (SEMVER_TAG_RE.test(trimmed)) {
    return releaseFromTag(trimmed);
  }
  throw new Error(
    `Invalid version "${versionOrSha}": expected "v1", a semver tag like "v1.0.0", or a 40-char commit SHA`,
  );
}
