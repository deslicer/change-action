export interface ResolvedRelease {
  tag: string;
  semver: string;
  sha: string;
}

export interface InstalledBinary {
  dir: string;
  full: string;
}
