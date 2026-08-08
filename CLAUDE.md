# Project guide

Next.js 16 App Router language-learning app. TypeScript, MUI 9, Zustand, Prisma 6
against MongoDB, three AI providers behind `AIFactory`. Package manager is npm.

The UI language is Russian on purpose — user-facing strings, emails and AI prompts
stay Russian. Code, comments and commit messages are English.

## Quality gates — non-negotiable rules

Quality here is checked by machine, not by reading diffs. The rules below are not
style preferences; breaking them defeats the point of the gates.

### Never weaken a gate to make it pass

Forbidden without an explicit human decision:

- lowering any threshold (`complexity`, `max-depth`, `max-lines-per-function`,
  `max-params`, CRAP, Stryker `break`);
- adding `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`;
- `it.skip`, `describe.skip`, `it.only`, `test.todo` on a test that used to run;
- excluding a file, directory or rule from lint, coverage, CRAP or mutation runs;
- raising the counts in `quality-baseline.json`;
- `--no-verify`, `--force`, or otherwise bypassing a hook.

When a gate fails, **fix the code or the tests**. If a threshold is genuinely
unreachable, say so explicitly, explain why, and propose an option — do not
quietly adjust it.

### Thresholds in force

| Gate                                          | Threshold                                                                                                               | Where                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------- |
| TypeScript                                    | `strict` + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch` | `tsconfig.json`       |
| Cyclomatic complexity                         | 8                                                                                                                       | `eslint.config.mjs`   |
| Nesting depth                                 | 3                                                                                                                       | `eslint.config.mjs`   |
| Function length                               | 50 lines (blank lines and comments excluded)                                                                            | `eslint.config.mjs`   |
| Parameters                                    | 4                                                                                                                       | `eslint.config.mjs`   |
| Floating promises, `any`, non-null assertions | error                                                                                                                   | `eslint.config.mjs`   |
| CRAP score                                    | 8                                                                                                                       | `npm run crap`        |
| Mutation score                                | 89% break                                                                                                               | `stryker.config.json` |

### The ratchet

The codebase predates these gates, so 84 lint violations and 129 CRAP violations
already exist. `quality-baseline.json` records those counts and
`scripts/ratchet.mjs` fails the build if either **grows**.

This is not a lowered threshold. New and modified code must meet the full
thresholds immediately. The recorded counts may only go down; the target is 0.
After genuinely removing violations, run `npm run ratchet:update` to lock in the
improvement.

### Commands

```bash
npm run gate:fast   # typecheck + lint, runs after every edit
npm run gate        # full gate: typecheck, lint, coverage, ratchet, mutation
npm run test        # vitest
npm run coverage    # vitest with coverage (writes coverage/coverage-final.json)
npm run crap        # CRAP report, needs a fresh coverage run
npm run mutation    # Stryker on src/utils/exerciseContent.ts
```

`npm run crap` and `npm run ratchet` read the coverage report from disk — always
run `npm run coverage` first or the numbers will be stale and wrong.

## Testing notes

- Tests live next to their subject as `*.test.ts` and run in the `node` environment.
- Coverage uses the **istanbul** provider, not v8: v8 reports arrow functions as
  `(anonymous_N)` and crap4ts cannot match those back to a function.
- Property-based tests (`src/utils/properties.test.ts`) assert real invariants
  only — reversibility, idempotence, size preservation. Do not invent artificial
  properties to pad the file.
- Contract tests and gate configs are write-protected in `.claude/settings.json`.

## Gotchas

- `postinstall` runs `prisma db push`, so a plain `npm install` writes to the
  database in `DATABASE_URL`. Use `npm ci --ignore-scripts` plus a separate
  `npx prisma generate` when you only need dependencies.
- Prisma is pinned to 6.x: version 7 has no MongoDB support yet.
- ESLint stays on 9.x (eslint-plugin-react rejects 10) and TypeScript on 5.x
  (`@typescript-eslint` peer range excludes 7).
- Prisma input types reject an explicit `undefined` under
  `exactOptionalPropertyTypes` — use `omitUndefined` from `src/utils`.
- JS `\b` is ASCII-only and never matches after a Cyrillic word. Use a
  `(?![\p{L}\p{N}])` lookahead with the `u` flag instead.
