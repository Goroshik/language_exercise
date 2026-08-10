/**
 * Contract test for the quality gates themselves.
 *
 * `.claude/settings.json` cannot protect itself — whatever holds the deny list
 * has to be editable to be maintained. This test is the backstop: if anyone
 * loosens a threshold, drops a hook or removes a deny entry, the gate goes red.
 *
 * These assertions may only be tightened, never relaxed.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');
const readJson = (path: string) => JSON.parse(read(path));

describe('tsconfig keeps the strict flags', () => {
  const compilerOptions = readJson('tsconfig.json').compilerOptions;

  it.each([
    'strict',
    'noUncheckedIndexedAccess',
    'exactOptionalPropertyTypes',
    'noImplicitOverride',
    'noFallthroughCasesInSwitch'
  ])('%s is enabled', flag => {
    expect(compilerOptions[flag]).toBe(true);
  });
});

describe('eslint keeps the complexity budget', () => {
  const config = read('eslint.config.mjs');

  it('caps cyclomatic complexity at 8', () => {
    expect(config).toMatch(/complexity:\s*\['error',\s*8\]/);
  });

  it('caps nesting depth at 3', () => {
    expect(config).toMatch(/'max-depth':\s*\['error',\s*3\]/);
  });

  it('caps function length at 50 lines', () => {
    expect(config).toMatch(/'max-lines-per-function':\s*\['error',\s*\{\s*max:\s*50/);
  });

  it('caps parameters at 4', () => {
    expect(config).toMatch(/'max-params':\s*\['error',\s*4\]/);
  });

  it.each([
    '@typescript-eslint/no-floating-promises',
    '@typescript-eslint/no-explicit-any',
    '@typescript-eslint/no-non-null-assertion'
  ])('%s stays at error', rule => {
    expect(config).toContain(`'${rule}': 'error'`);
  });

  it('keeps type-aware linting on', () => {
    expect(config).toContain('projectService: true');
  });

  it('does not silence the budget for source files', () => {
    // The only permitted relaxation is max-lines-per-function inside tests.
    const relaxations = config.match(/'(complexity|max-depth|max-params)':\s*'off'/g) ?? [];
    expect(relaxations).toEqual([]);
  });
});

describe('stryker keeps a breaking mutation threshold', () => {
  const config = readJson('stryker.config.json');

  it('breaks below 89%', () => {
    expect(config.thresholds.break).toBeGreaterThanOrEqual(89);
  });

  it('always cleans its sandbox so lint never sees a project copy', () => {
    expect(config.cleanTempDir).toBe('always');
  });

  it('mutates real source, never test files', () => {
    expect(config.mutate).toContain('!src/**/*.test.ts');
    expect(config.mutate.filter((glob: string) => !glob.startsWith('!')).length).toBeGreaterThan(0);
  });
});

describe('claude settings keep the gates wired', () => {
  const settings = readJson('.claude/settings.json');
  const deny: string[] = settings.permissions.deny;

  it('runs the fast gate after every edit', () => {
    const commands = settings.hooks.PostToolUse.flatMap((entry: { hooks: { command: string }[] }) =>
      entry.hooks.map(hook => hook.command)
    );
    expect(commands).toContain('npm run gate:fast');
  });

  it('runs the full gate before stopping', () => {
    const commands = settings.hooks.Stop.flatMap((entry: { hooks: { command: string }[] }) =>
      entry.hooks.map(hook => hook.command)
    );
    expect(commands).toContain('npm run gate');
  });

  it.each([
    'eslint.config.mjs',
    'tsconfig.json',
    'stryker.config.json',
    'vitest.config.ts',
    'quality-baseline.json',
    'scripts/ratchet.mjs'
  ])('%s stays write-protected', file => {
    expect(deny).toContain(`Write(./${file})`);
    expect(deny).toContain(`Edit(./${file})`);
  });
});

describe('the ratchet only moves down', () => {
  const baseline = readJson('quality-baseline.json');

  // Ceilings recorded when the gates were introduced. Lowering these is the
  // whole point; raising one means the debt grew and must not be accepted.
  it.each([
    ['lintErrors', 63],
    ['crapViolations', 107],
    ['suppressions', 20]
  ])('%s never exceeds %i', (counter, ceiling) => {
    expect(baseline[counter as string]).toBeLessThanOrEqual(ceiling as number);
  });
});
