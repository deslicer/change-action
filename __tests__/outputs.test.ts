import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  readForwardedOutputs,
  renderForwardedSummary,
} from '../src/lib/outputs';

describe('readForwardedOutputs', () => {
  it('parses key=value lines written by the CLI', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-out-'));
    const file = path.join(dir, 'output');
    fs.writeFileSync(
      file,
      'plan_id=abc-123\nplan_status=pending_approval\nplan_summary=2 change(s): +1 ~1 -0\n',
    );
    const outputs = readForwardedOutputs(file);
    expect(outputs.plan_id).toBe('abc-123');
    expect(outputs.plan_status).toBe('pending_approval');
    expect(outputs.plan_summary).toContain('2 change(s)');
  });
});

describe('renderForwardedSummary', () => {
  it('renders a markdown table for plan commands', () => {
    const md = renderForwardedSummary('verify', {
      plan_id: 'ext-id',
      plan_status: 'pending_approval',
      plan_summary: '3 change(s): +1 ~1 -1',
      diff_total: '3',
      diff_additions: '1',
      diff_modifications: '1',
      diff_deletions: '1',
    });
    expect(md).toContain('ext-id');
    expect(md).toContain('pending_approval');
    expect(md).toContain('3 change(s)');
  });
});
