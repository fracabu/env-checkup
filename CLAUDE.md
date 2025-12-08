# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**env-doctor** is a CLI tool and library to validate, audit, and sync `.env` files against `.env.example`. It's a zero-dependency TypeScript project targeting Node.js v20+.

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Build with tsdown
npm run typecheck    # Type check with tsc
npm test             # Run tests with tap
npm run lint         # Lint with ESLint 9 (flat config)
npm run format       # Format with Prettier
npm run validate     # Validate package (publint + arethetypeswrong)

# Run CLI locally
node bin/env-doctor.js --help
node bin/env-doctor.js --env test/fixtures/missing-vars.env --example test/fixtures/valid.env.example
```

## Architecture

```
src/
├── index.ts      # Library exports (validate, parse)
├── cli.ts        # CLI entry point using node:util parseArgs
├── parser.ts     # .env file parser (handles quotes, comments, export prefix, inline comments)
├── validator.ts  # Validation logic (missing, extra, empty vars)
├── reporter.ts   # Output formatting (text with ANSI colors, JSON)
└── types.ts      # TypeScript interfaces
```

## Key Design Decisions (2025 Best Practices)

- **tsdown** (not tsup): tsup is no longer maintained, tsdown is the Rolldown-powered successor
- **Pure ESM**: No CJS support, Node.js 20+ has native ESM support
- **No external CLI framework**: Uses Node.js built-in `parseArgs` from `node:util`
- **No dotenv dependency**: Custom parser implementation
- **ESLint 9 flat config**: Uses `eslint.config.js` (not `.eslintrc.*`)
- **Package validation**: Uses `publint` and `@arethetypeswrong/cli` before publish

### TypeScript Configuration

- `verbatimModuleSyntax`: true (replaces esModuleInterop for ESM)
- `isolatedModules`: true (bundler compatibility)
- `noEmit`: true (tsdown handles emit)

### Parser Edge Cases

The parser must handle: basic `KEY=value`, quoted values (single/double), empty values, comments (`#`), inline comments, `export` prefix, and multiline quoted values.

### Validation Logic

- **Missing**: vars in example but not in env (causes `valid: false`)
- **Extra**: vars in env but not in example (warning only)
- **Empty**: vars with empty values (warning only)

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Missing variables (in CI mode) |
| 2 | File not found or parse error |

## Test Fixtures

Test fixtures are in `test/fixtures/`: `valid.env`, `valid.env.example`, `missing-vars.env`, `extra-vars.env`, `empty-vars.env`
