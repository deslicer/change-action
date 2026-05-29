import * as core from '@actions/core';

async function main(): Promise<void> {
  core.info('deslicer/change-action scaffold — implementation pending Plan 1d Task 1');
  core.setFailed('Not implemented yet');
}

main().catch((err: unknown) => {
  if (err instanceof Error) {
    core.setFailed(err.stack ?? err.message);
  } else {
    core.setFailed(String(err));
  }
});
