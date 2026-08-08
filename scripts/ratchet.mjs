#!/usr/bin/env node
/**
 * Quality ratchet.
 *
 * The thresholds themselves (complexity 8, max-depth 3, max-lines 50,
 * max-params 4, CRAP 8) are NOT negotiable and live in eslint.config.mjs and
 * the crap script. What this file tracks is how many places still violate them.
 *
 * The recorded counts may only go DOWN. Any change that adds a violation fails
 * the gate, so new code has to meet the thresholds immediately while the
 * pre-existing debt is paid off gradually. The target for every counter is 0.
 *
 *   node scripts/ratchet.mjs             # check lint + CRAP against the baseline
 *   node scripts/ratchet.mjs --lint-only # skip CRAP (needs no coverage run)
 *   node scripts/ratchet.mjs --update    # record current counts (only if lower)
 */
import { execFileSync } from 'node:child_process';
import { globSync, readFileSync, writeFileSync } from 'node:fs';

const BASELINE_FILE = 'quality-baseline.json';
const CRAP_THRESHOLD = 8;
const isUpdate = process.argv.includes('--update');
const lintOnly = process.argv.includes('--lint-only');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runJson(args) {
  try {
    return JSON.parse(
      execFileSync(npx, args, {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        // npx is a .cmd shim on Windows and is not directly executable.
        shell: process.platform === 'win32'
      })
    );
  } catch (error) {
    // Both tools exit non-zero when they find problems; the report is still on stdout.
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

function countLintErrors() {
  const report = runJson(['eslint', '.', '--format', 'json']);
  return report.reduce(
    (total, file) => total + file.messages.filter(message => message.severity === 2).length,
    0
  );
}

function countCrapViolations() {
  const report = runJson([
    'crap4ts',
    '--coverage',
    'coverage/coverage-final.json',
    '--src',
    'src',
    // A CRAP score for a test's own callbacks is meaningless.
    '--exclude',
    '**/*.test.ts',
    '**/*.test.tsx',
    'src/generated/**',
    '-t',
    String(CRAP_THRESHOLD),
    '-f',
    'json'
  ]);
  return report.summary.exceedingThreshold;
}

const SUPPRESSION_PATTERN =
  /eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck|\.only\(|\.skip\(/;

/** Counts suppressions in src/, which quietly bypass the rules above. */
function countSuppressions() {
  const files = globSync('src/**/*.{ts,tsx}', {
    ignore: ['src/generated/**', 'src/gateContract.test.ts']
  });
  return files.reduce((total, file) => {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    return total + lines.filter(line => SUPPRESSION_PATTERN.test(line)).length;
  }, 0);
}

const current = { lintErrors: countLintErrors(), suppressions: countSuppressions() };
if (!lintOnly) current.crapViolations = countCrapViolations();

const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));

let failed = false;
for (const [name, count] of Object.entries(current)) {
  const allowed = baseline[name];
  const verdict = count > allowed ? 'REGRESSION' : count < allowed ? 'improved' : 'unchanged';
  console.log(`${name}: ${count} (baseline ${allowed}) - ${verdict}`);
  if (count > allowed) failed = true;
}

if (isUpdate) {
  const next = { ...baseline };
  for (const [name, count] of Object.entries(current)) {
    next[name] = Math.min(count, baseline[name]);
  }
  writeFileSync(BASELINE_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`\n${BASELINE_FILE} updated. Counts can only be lowered, never raised.`);
  process.exit(0);
}

if (failed) {
  console.error(
    '\nThe number of violations grew. Fix the new code - do not raise the baseline.\n' +
      'Thresholds stay at complexity 8 / max-depth 3 / max-lines 50 / max-params 4 / CRAP 8.'
  );
  process.exit(1);
}

process.exit(0);
