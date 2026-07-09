import * as fs from 'node:fs';

/** Keys the deslicer CLI writes to GITHUB_OUTPUT that we forward as action outputs. */
export const FORWARDED_OUTPUT_KEYS = [
  'plan_id',
  'plan_row_id',
  'plan_status',
  'plan_summary',
  'progress_status',
  'total_items',
  'fully_completed_items',
  'diff_total',
  'diff_additions',
  'diff_modifications',
  'diff_deletions',
  'diff_has_destructive',
  'execution_id',
  'execution_status',
  'jobs_total',
  'jobs_succeeded',
  'jobs_failed',
] as const;

export type ForwardedOutputKey = (typeof FORWARDED_OUTPUT_KEYS)[number];

export type ForwardedOutputs = Partial<Record<ForwardedOutputKey, string>>;

/**
 * Parse the job step GITHUB_OUTPUT file after the CLI subprocess appends to it.
 * Returns the last value seen for each known key.
 */
export function readForwardedOutputs(outputPath = process.env.GITHUB_OUTPUT): ForwardedOutputs {
  if (!outputPath || !fs.existsSync(outputPath)) {
    return {};
  }
  const content = fs.readFileSync(outputPath, 'utf8');
  const values: ForwardedOutputs = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) {
      continue;
    }
    const delimiter = line.indexOf('=');
    if (delimiter <= 0) {
      continue;
    }
    const key = line.slice(0, delimiter) as ForwardedOutputKey;
    if (!(FORWARDED_OUTPUT_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    let value = line.slice(delimiter + 1);
    if (value.endsWith('%0A')) {
      value = value.slice(0, -3).replace(/%0A/g, '\n');
    }
    values[key] = value;
  }
  return values;
}

export function renderForwardedSummary(
  command: string,
  outputs: ForwardedOutputs,
): string | undefined {
  if (!outputs.plan_id && !outputs.execution_id) {
    return undefined;
  }
  const lines = [
    '## Deslicer change-action',
    '',
    `**Command:** \`${command}\``,
    '',
    '| Field | Value |',
    '| --- | --- |',
  ];
  if (outputs.plan_id) {
    lines.push(`| Plan ID | \`${outputs.plan_id}\` |`);
  }
  if (outputs.plan_status) {
    lines.push(`| Plan status | **${outputs.plan_status}** |`);
  }
  if (outputs.plan_summary) {
    lines.push(`| Summary | ${outputs.plan_summary} |`);
  }
  if (outputs.diff_total) {
    lines.push(
      `| Changes | ${outputs.diff_total} (+${outputs.diff_additions ?? '0'} / ~${outputs.diff_modifications ?? '0'} / -${outputs.diff_deletions ?? '0'}) |`,
    );
  }
  if (outputs.progress_status) {
    lines.push(`| Progress | ${outputs.progress_status} |`);
  }
  if (outputs.execution_id) {
    lines.push(`| Execution | \`${outputs.execution_id}\` |`);
  }
  if (outputs.execution_status) {
    lines.push(`| Execution status | **${outputs.execution_status}** |`);
  }
  if (outputs.jobs_total) {
    lines.push(
      `| Jobs | ${outputs.jobs_succeeded ?? '0'}/${outputs.jobs_total} succeeded |`,
    );
  }
  if (lines.length <= 6) {
    return undefined;
  }
  return lines.join('\n');
}
