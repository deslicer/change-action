import { CLI_REPO_NAME, CLI_REPO_OWNER, GITHUB_API } from './constants';

interface GhRelease {
  tag_name: string;
  target_commitish: string;
}

interface GhTagRef {
  object: { type: string; sha: string; url?: string };
}

export async function githubFetch<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API}${path}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API ${path} failed: HTTP ${response.status} ${response.statusText} — ${body.slice(0, 200)}`,
    );
  }
  return (await response.json()) as T;
}

export async function fetchLatestRelease(): Promise<GhRelease> {
  return githubFetch<GhRelease>(`/repos/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/releases/latest`);
}

export async function fetchReleaseByTag(tag: string): Promise<GhRelease> {
  return githubFetch<GhRelease>(
    `/repos/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/releases/tags/${encodeURIComponent(tag)}`,
  );
}

export async function listReleases(): Promise<GhRelease[]> {
  return githubFetch<GhRelease[]>(
    `/repos/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/releases?per_page=100`,
  );
}

export async function resolveTagCommitSha(tag: string): Promise<string> {
  const ref = await githubFetch<GhTagRef>(
    `/repos/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/git/ref/tags/${encodeURIComponent(tag)}`,
  );
  if (ref.object.type === 'commit') {
    return ref.object.sha;
  }
  if (!ref.object.url) {
    throw new Error(`Unable to peel annotated tag ${tag}: missing object URL`);
  }
  const tagObj = await fetch(ref.object.url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!tagObj.ok) {
    throw new Error(`Failed to peel tag ${tag}: HTTP ${tagObj.status}`);
  }
  const body = (await tagObj.json()) as { object: { sha: string } };
  return body.object.sha;
}
