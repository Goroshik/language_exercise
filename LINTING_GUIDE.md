# Linting and Formatting Guide

## Overview

This project uses ESLint for code linting and Prettier for code formatting. All files are now consistently formatted to prevent unnecessary changes in feature branches.

## Available Commands

### Linting

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Formatting

```bash
# Format all files with Prettier
npm run format
```

## ESLint Configuration

The project uses a strict ESLint configuration with the following features:

### 1. TypeScript Support
- Full TypeScript linting with `@typescript-eslint`
- Strict type checking rules
- Warnings for `any` types (should be avoided when possible)
- Warnings for non-null assertions (use with caution)

### 2. React Support
- React and React Hooks linting
- React Refresh plugin for development
- Automatic JSX scope handling (no need to import React in Next.js 15+)

### 3. Prettier Integration
- ESLint runs Prettier as part of the linting process
- Configuration from `.prettierrc` is enforced
- Consistent formatting across the entire codebase

### 4. Global Variables
All necessary browser and Node.js globals are configured:
- Browser APIs: `window`, `document`, `fetch`, `localStorage`, etc.
- Web APIs: `URL`, `Request`, `Response`, `TextEncoder`, etc.
- Node.js: `process`, `Buffer`, `__dirname`, etc.
- HTML Elements: `HTMLElement`, `MouseEvent`, `CustomEvent`, etc.

## Current Status

**Linting Issues:**
- **Errors**: 0 ✅
- **Warnings**: 84 (acceptable)

The remaining warnings are:
- `@typescript-eslint/no-explicit-any`: Some legitimate uses of `any` type
- `@typescript-eslint/no-unused-vars`: Intentionally unused error variables in catch blocks
- `@typescript-eslint/no-non-null-assertion`: Safe non-null assertions
- `react-hooks/exhaustive-deps`: Some useEffect dependencies are intentionally omitted

## Recommended Workflow

### Before Committing

Always run linting and formatting before committing code:

```bash
# 1. Format all files
npm run format

# 2. Fix linting issues
npm run lint:fix

# 3. Check for remaining issues
npm run lint

# 4. Fix any remaining issues manually if needed
```

### In Feature Branches

To prevent files from constantly changing due to formatting:

1. **Pull latest changes** from main/master before starting work
2. **Run `npm run format`** at the start of your work
3. **Commit the formatting changes** separately (if any)
4. **Start your feature work** on top of the formatted code
5. **Run `npm run lint:fix`** before committing your changes

### IDE Integration

For the best experience, configure your IDE to:

1. **Auto-format on save** using Prettier
2. **Show ESLint warnings** inline
3. **Auto-fix on save** for ESLint issues (optional)

#### VS Code Configuration

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

## Ignored Files

The following patterns are ignored by ESLint:

- `dist/`, `build/`, `.next/` - Build outputs
- `node_modules/` - Dependencies
- `src/generated/**` - Generated Prisma client
- `*.config.js`, `*.config.ts` - Configuration files
- `next-env.d.ts` - Next.js generated types

## Troubleshooting

### "Module not found" errors

If you see module resolution errors:

```bash
npm install
```

### Linting is very slow

ESLint can be slow on large codebases. If it's too slow:

1. Use `npm run lint -- --cache` to enable caching
2. Consider linting only changed files: `npm run lint -- src/path/to/file.ts`

### Formatting conflicts with ESLint

If Prettier and ESLint conflict:

1. Run `npm run format` first
2. Then run `npm run lint:fix`
3. The ESLint config includes `eslint-config-prettier` to prevent conflicts

## Contributing

When contributing to this project:

1. **Follow the existing code style** - it's enforced by ESLint and Prettier
2. **Run linting before committing** - use the commands above
3. **Don't disable linting rules** without good reason and team discussion
4. **Keep warnings under control** - aim to fix warnings when possible

## Questions?

If you encounter linting issues or have questions about the configuration, please:

1. Check this guide
2. Review the `eslint.config.js` file
3. Ask the team in your PR or issue
