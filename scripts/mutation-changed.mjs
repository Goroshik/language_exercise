#!/usr/bin/env node
/**
 * Mutation testing for the files this branch touched.
 *
 * The full run grows linearly with the mutate list, so it belongs in CI. This
 * script narrows it to the intersection of two sets: files changed against the
 * base ref, and files stryker.config.json is configured to mutate. Anything
 * outside that intersection is skipped, never silently assumed to pass.
 *
 *   node scripts/mutation-changed.mjs                 # uncommitted work only
 *   node scripts/mutation-changed.mjs origin/master   # everything on this branch
 *
 * With no argument it looks at the working tree, which is what you want while
 * editing. Pass a ref to cover the whole branch, which is what you want before
 * opening a pull request.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BASE_REF = process.argv[2] ?? null;
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const onWindows = process.platform === 'win32';

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

/** Uncommitted work, plus the branch's commits when a base ref was given. */
function changedFiles() {
  const parts = [
    run('git', ['diff', '--name-only', 'HEAD']),
    run('git', ['ls-files', '--others', '--exclude-standard'])
  ];

  if (BASE_REF) {
    parts.push(run('git', ['diff', '--name-only', `${BASE_REF}...HEAD`]));
  }

  return new Set(
    parts
      .join('\n')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
  );
}

/** The positive entries of the mutate list; the `!` exclusions are left to stryker. */
function configuredTargets() {
  const config = JSON.parse(readFileSync('stryker.config.json', 'utf8'));
  return config.mutate.filter(pattern => !pattern.startsWith('!'));
}

const changed = changedFiles();
const targets = configuredTargets().filter(file => changed.has(file));

if (targets.length === 0) {
  console.log(
    `No mutated module changed${BASE_REF ? ` against ${BASE_REF}` : ``}. Skipping mutation testing.`
  );
  console.log('Run `npm run mutation` for the full set.');
  process.exit(0);
}

const skipped = configuredTargets().length - targets.length;
console.log(`Mutating ${targets.length} changed module(s), skipping ${skipped}:`);
for (const target of targets) console.log(`  ${target}`);

try {
  execFileSync(npx, ['stryker', 'run', '--mutate', targets.join(',')], {
    stdio: 'inherit',
    shell: onWindows
  });
} catch {
  // Stryker already reported why; do not bury its exit code.
  process.exit(1);
}
