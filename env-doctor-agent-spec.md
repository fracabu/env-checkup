# 🤖 Agent Specification: env-doctor

## Project Overview

**Package Name:** `env-doctor`  
**Type:** CLI Tool + Library  
**Author:** fracabu (Francesco Capurso)  
**License:** MIT  
**Target:** Node.js v20+  

### One-Line Description
> CLI tool to validate, audit, and sync `.env` files against `.env.example` with CI/CD support.

---

## Problem Statement

Developers frequently face these issues:
1. **Missing environment variables** - Deploy fails because a required var is missing
2. **Undocumented variables** - `.env` has vars not in `.env.example`
3. **Empty variables** - Variable defined but has no value
4. **Team sync issues** - Different team members have different env setups

**env-doctor** solves all of these with a single command.

---

## Technical Requirements

### Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript 5.x |
| Module System | Pure ESM (`"type": "module"`) |
| Node.js | v20+ |
| Test Framework | tap v21+ (node-tap) |
| Build Tool | tsdown (tsup successor, powered by Rolldown) |
| CLI Framework | None (use native Node.js `parseArgs`) |
| Linting | ESLint 9+ (flat config) + Prettier |
| Validation | publint + @arethetypeswrong/cli |

### Project Structure

```
env-doctor/
├── src/
│   ├── index.ts          # Library exports
│   ├── cli.ts            # CLI entry point
│   ├── parser.ts         # .env file parser
│   ├── validator.ts      # Validation logic
│   ├── reporter.ts       # Output formatting (text, JSON)
│   └── types.ts          # TypeScript types
├── bin/
│   └── env-doctor.js     # CLI executable (shebang wrapper)
├── test/
│   ├── parser.test.ts
│   ├── validator.test.ts
│   ├── cli.test.ts
│   └── fixtures/
│       ├── valid.env
│       ├── valid.env.example
│       ├── missing-vars.env
│       ├── extra-vars.env
│       └── empty-vars.env
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json
├── tsconfig.json
├── tsdown.config.ts
├── eslint.config.js
├── .prettierrc
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## Functional Specifications

### CLI Interface

```bash
# Basic usage (uses defaults: .env vs .env.example)
npx env-doctor

# Custom files
npx env-doctor --env .env.production --example .env.example

# CI mode (exit code 1 if errors)
npx env-doctor --ci

# JSON output
npx env-doctor --json

# Quiet mode (only errors)
npx env-doctor --quiet

# Show help
npx env-doctor --help

# Show version
npx env-doctor --version
```

### CLI Options

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--env` | `-e` | `.env` | Path to env file to validate |
| `--example` | `-x` | `.env.example` | Path to example/template file |
| `--ci` | | `false` | CI mode: exit 1 on any error |
| `--json` | `-j` | `false` | Output as JSON |
| `--quiet` | `-q` | `false` | Only show errors |
| `--no-color` | | `false` | Disable colored output |
| `--help` | `-h` | | Show help |
| `--version` | `-v` | | Show version |

### Library API

```typescript
import { validate, parse, ValidationResult } from 'env-doctor'

// Full validation
const result: ValidationResult = await validate({
  envPath: '.env',
  examplePath: '.env.example'
})

console.log(result.valid)      // boolean
console.log(result.missing)    // string[] - vars in example but not in env
console.log(result.extra)      // string[] - vars in env but not in example
console.log(result.empty)      // string[] - vars with empty values
console.log(result.envVars)    // Record<string, string> - parsed env
console.log(result.exampleVars) // Record<string, string> - parsed example

// Just parse a file
const vars = await parse('.env')
// { DATABASE_URL: 'postgres://...', PORT: '3000' }
```

---

## Type Definitions

```typescript
// src/types.ts

export interface ValidateOptions {
  envPath?: string
  examplePath?: string
}

export interface ValidationResult {
  valid: boolean
  missing: string[]
  extra: string[]
  empty: string[]
  envVars: Record<string, string>
  exampleVars: Record<string, string>
  errors: ValidationError[]
}

export interface ValidationError {
  type: 'missing' | 'extra' | 'empty' | 'parse_error'
  variable?: string
  message: string
  file?: string
}

export interface ParseResult {
  vars: Record<string, string>
  lines: ParsedLine[]
}

export interface ParsedLine {
  lineNumber: number
  raw: string
  key?: string
  value?: string
  isComment: boolean
  isEmpty: boolean
}

export interface CliOptions {
  env: string
  example: string
  ci: boolean
  json: boolean
  quiet: boolean
  noColor: boolean
}

export interface ReportOptions {
  format: 'text' | 'json'
  noColor: boolean
  quiet: boolean
}
```

---

## Implementation Details

### Parser (`src/parser.ts`)

The parser must handle:

1. **Basic variables:** `KEY=value`
2. **Quoted values:** `KEY="value with spaces"` or `KEY='value'`
3. **Empty values:** `KEY=` or `KEY=""`
4. **Comments:** Lines starting with `#`
5. **Empty lines:** Skip them
6. **Inline comments:** `KEY=value # comment` (value is `value`)
7. **Multiline values:** Values enclosed in quotes with `\n`
8. **Export prefix:** `export KEY=value` (strip `export`)
9. **Whitespace:** Trim keys, preserve quoted values

```typescript
// Example implementation signature
export async function parse(filePath: string): Promise<ParseResult>
export function parseLine(line: string, lineNumber: number): ParsedLine
```

### Validator (`src/validator.ts`)

```typescript
export async function validate(options: ValidateOptions): Promise<ValidationResult>
```

Logic:
1. Parse both files
2. Find missing: keys in example but not in env
3. Find extra: keys in env but not in example
4. Find empty: keys in env with empty string value
5. Set `valid = missing.length === 0` (extra and empty are warnings)

### Reporter (`src/reporter.ts`)

```typescript
export function report(result: ValidationResult, options: ReportOptions): string
```

#### Text Output Format

```
env-doctor v1.0.0

Checking .env against .env.example...

✗ Missing (2):
  • DATABASE_URL
  • API_SECRET

⚠ Extra (1):
  • OLD_DEPRECATED_VAR

⚠ Empty (1):
  • REDIS_URL

Summary:
  ✓ Valid: 12 variables
  ✗ Missing: 2 variables
  ⚠ Extra: 1 variable
  ⚠ Empty: 1 variable

Result: FAILED (missing required variables)
```

#### JSON Output Format

```json
{
  "valid": false,
  "summary": {
    "total": 16,
    "valid": 12,
    "missing": 2,
    "extra": 1,
    "empty": 1
  },
  "missing": ["DATABASE_URL", "API_SECRET"],
  "extra": ["OLD_DEPRECATED_VAR"],
  "empty": ["REDIS_URL"],
  "variables": {
    "PORT": "3000",
    "NODE_ENV": "development"
  }
}
```

### CLI (`src/cli.ts`)

```typescript
#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { validate } from './validator.js'
import { report } from './reporter.js'

// Parse CLI arguments using Node.js built-in parseArgs
// No external dependencies for CLI parsing
```

Use `node:util` `parseArgs` (Node.js 18.3+) - no external CLI framework needed.

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Missing variables found (in CI mode) |
| 2 | File not found or parse error |

---

## Test Cases

### Parser Tests

```typescript
// test/parser.test.ts

import { test } from 'tap'
import { parse, parseLine } from '../src/parser.js'

test('parseLine - basic key=value', async (t) => {
  const result = parseLine('DATABASE_URL=postgres://localhost', 1)
  t.equal(result.key, 'DATABASE_URL')
  t.equal(result.value, 'postgres://localhost')
})

test('parseLine - quoted value with spaces', async (t) => {
  const result = parseLine('MESSAGE="Hello World"', 1)
  t.equal(result.value, 'Hello World')
})

test('parseLine - empty value', async (t) => {
  const result = parseLine('EMPTY_VAR=', 1)
  t.equal(result.key, 'EMPTY_VAR')
  t.equal(result.value, '')
})

test('parseLine - comment line', async (t) => {
  const result = parseLine('# This is a comment', 1)
  t.equal(result.isComment, true)
  t.equal(result.key, undefined)
})

test('parseLine - export prefix', async (t) => {
  const result = parseLine('export API_KEY=secret123', 1)
  t.equal(result.key, 'API_KEY')
  t.equal(result.value, 'secret123')
})

test('parseLine - inline comment', async (t) => {
  const result = parseLine('PORT=3000 # default port', 1)
  t.equal(result.key, 'PORT')
  t.equal(result.value, '3000')
})

test('parseLine - single quotes', async (t) => {
  const result = parseLine("PASSWORD='my secret'", 1)
  t.equal(result.value, 'my secret')
})

test('parse - full file', async (t) => {
  const result = await parse('./test/fixtures/valid.env')
  t.ok(result.vars.PORT)
  t.ok(result.vars.DATABASE_URL)
})
```

### Validator Tests

```typescript
// test/validator.test.ts

import { test } from 'tap'
import { validate } from '../src/validator.js'

test('validate - all vars present', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/valid.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.equal(result.valid, true)
  t.equal(result.missing.length, 0)
})

test('validate - missing vars', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/missing-vars.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.equal(result.valid, false)
  t.ok(result.missing.includes('DATABASE_URL'))
})

test('validate - extra vars (warning, still valid)', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/extra-vars.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.equal(result.valid, true) // Extra vars don't fail
  t.ok(result.extra.length > 0)
})

test('validate - empty vars (warning)', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/empty-vars.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.ok(result.empty.length > 0)
})

test('validate - file not found', async (t) => {
  await t.rejects(validate({
    envPath: './nonexistent.env',
    examplePath: './test/fixtures/valid.env.example'
  }))
})
```

### CLI Tests

```typescript
// test/cli.test.ts

import { test } from 'tap'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const CLI = join(import.meta.dirname, '../bin/env-doctor.js')

test('cli - help flag', async (t) => {
  const output = execSync(`node ${CLI} --help`).toString()
  t.ok(output.includes('Usage:'))
  t.ok(output.includes('--env'))
})

test('cli - version flag', async (t) => {
  const output = execSync(`node ${CLI} --version`).toString()
  t.match(output, /\d+\.\d+\.\d+/)
})

test('cli - valid env returns exit 0', async (t) => {
  const result = execSync(
    `node ${CLI} --env ./test/fixtures/valid.env --example ./test/fixtures/valid.env.example`,
    { encoding: 'utf8' }
  )
  t.ok(result.includes('✓') || result.includes('valid'))
})

test('cli - missing vars in CI mode returns exit 1', async (t) => {
  try {
    execSync(
      `node ${CLI} --ci --env ./test/fixtures/missing-vars.env --example ./test/fixtures/valid.env.example`
    )
    t.fail('Should have thrown')
  } catch (error: any) {
    t.equal(error.status, 1)
  }
})

test('cli - json output', async (t) => {
  const output = execSync(
    `node ${CLI} --json --env ./test/fixtures/valid.env --example ./test/fixtures/valid.env.example`
  ).toString()
  const json = JSON.parse(output)
  t.ok('valid' in json)
  t.ok('missing' in json)
})
```

---

## Test Fixtures

### `test/fixtures/valid.env`
```
PORT=3000
DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=sk_test_123456
NODE_ENV=development
```

### `test/fixtures/valid.env.example`
```
PORT=3000
DATABASE_URL=your_database_url_here
API_KEY=your_api_key_here
NODE_ENV=development
```

### `test/fixtures/missing-vars.env`
```
PORT=3000
NODE_ENV=development
# Missing DATABASE_URL and API_KEY
```

### `test/fixtures/extra-vars.env`
```
PORT=3000
DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=sk_test_123456
NODE_ENV=development
OLD_DEPRECATED_VAR=should_be_removed
ANOTHER_EXTRA=not_documented
```

### `test/fixtures/empty-vars.env`
```
PORT=3000
DATABASE_URL=
API_KEY=sk_test_123456
NODE_ENV=
```

---

## Configuration Files

### `package.json`

```json
{
  "name": "env-doctor",
  "version": "1.0.0",
  "description": "CLI tool to validate and audit .env files against .env.example",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "env-doctor": "./bin/env-doctor.js"
  },
  "files": [
    "dist",
    "bin"
  ],
  "scripts": {
    "build": "tsdown",
    "test": "tap",
    "lint": "eslint",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "validate": "publint && attw --pack .",
    "prepublishOnly": "npm run build && npm run validate && npm test"
  },
  "keywords": [
    "env",
    "dotenv",
    "environment",
    "variables",
    "validate",
    "validation",
    "audit",
    "cli",
    "ci",
    "devops"
  ],
  "author": "fracabu (Francesco Capurso)",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fracabu/env-doctor.git"
  },
  "bugs": {
    "url": "https://github.com/fracabu/env-doctor/issues"
  },
  "homepage": "https://github.com/fracabu/env-doctor#readme",
  "engines": {
    "node": ">=20.0.0"
  },
  "devDependencies": {
    "@arethetypeswrong/cli": "^0.17.0",
    "@types/node": "^22.10.0",
    "eslint": "^9.15.0",
    "prettier": "^3.4.0",
    "publint": "^0.2.12",
    "tap": "^21.0.0",
    "tsdown": "^0.4.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.16.0"
  }
}
```

> **Note 2025**: `types` condition MUST come before `import` in exports field for proper TypeScript resolution.

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

> **Note 2025**:
> - `verbatimModuleSyntax` replaces `esModuleInterop` for ESM
> - `isolatedModules` ensures compatibility with bundlers
> - `noEmit: true` because tsdown handles emit
> - `noUncheckedIndexedAccess` for stricter array/object access

### `tsdown.config.ts`

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
  treeshake: true
})
```

> **Note**: tsdown è il successore di tsup, powered by Rolldown (Rust). È ESM-first e ~49% più veloce.

### `bin/env-doctor.js`

```javascript
#!/usr/bin/env node
import '../dist/cli.js'
```

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run validate
      - run: npm test

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build
      - run: npm run validate
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

> **Note 2025**: Il workflow include ora `typecheck` e `validate` (publint + arethetypeswrong) per garantire qualità del package.

---

## README.md Template

```markdown
# env-doctor 🩺

> CLI tool to validate and audit `.env` files against `.env.example`

[![npm version](https://img.shields.io/npm/v/env-doctor.svg)](https://www.npmjs.com/package/env-doctor)
[![CI](https://github.com/fracabu/env-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/fracabu/env-doctor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

- 🔴 Deploy fails because `DATABASE_URL` is missing
- 🟡 `.env` has old variables not in `.env.example`
- 🟡 Variables are defined but empty
- 🔴 Team members have different env setups

## The Solution

```bash
npx env-doctor
```

```
env-doctor v1.0.0

Checking .env against .env.example...

✗ Missing (2):
  • DATABASE_URL
  • API_SECRET

⚠ Extra (1):
  • OLD_DEPRECATED_VAR

⚠ Empty (1):
  • REDIS_URL

Result: FAILED
```

## Installation

```bash
# Run directly with npx
npx env-doctor

# Or install globally
npm install -g env-doctor

# Or as dev dependency
npm install -D env-doctor
```

## Usage

### CLI

```bash
# Basic usage (checks .env against .env.example)
env-doctor

# Custom files
env-doctor --env .env.production --example .env.example

# CI mode (exit code 1 if missing variables)
env-doctor --ci

# JSON output (for parsing in scripts)
env-doctor --json

# Quiet mode (only errors)
env-doctor --quiet
```

### As a Library

```typescript
import { validate, parse } from 'env-doctor'

const result = await validate({
  envPath: '.env',
  examplePath: '.env.example'
})

if (!result.valid) {
  console.log('Missing variables:', result.missing)
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Check environment variables
  run: npx env-doctor --ci
```

### Pre-commit Hook

```json
// package.json
{
  "scripts": {
    "precommit": "env-doctor --ci"
  }
}
```

## Options

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--env` | `-e` | `.env` | Path to env file |
| `--example` | `-x` | `.env.example` | Path to example file |
| `--ci` | | `false` | Exit 1 on errors |
| `--json` | `-j` | `false` | JSON output |
| `--quiet` | `-q` | `false` | Only show errors |
| `--help` | `-h` | | Show help |
| `--version` | `-v` | | Show version |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Missing variables (CI mode) |
| 2 | File not found |

## License

MIT © [Francesco Capurso](https://github.com/fracabu)
```

---

## Acceptance Criteria

The implementation is complete when:

- [ ] `npx env-doctor` works with default paths
- [ ] `--env` and `--example` options work
- [ ] `--ci` flag returns exit code 1 on missing vars
- [ ] `--json` flag outputs valid JSON
- [ ] `--quiet` flag only shows errors
- [ ] `--help` shows usage information
- [ ] `--version` shows package version
- [ ] Parser handles all edge cases (quotes, comments, export, empty)
- [ ] Library API exports `validate` and `parse` functions
- [ ] All tests pass with `npm test`
- [ ] TypeScript types are exported correctly
- [ ] `npm run validate` passes (publint + arethetypeswrong)
- [ ] Package publishes to npm successfully
- [ ] README has badges and clear examples
- [ ] GitHub Actions CI/CD is configured

---

## Development Commands

```bash
# Install dependencies
npm install

# Build (with tsdown)
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Run CLI locally
node bin/env-doctor.js --help

# Test against fixtures
node bin/env-doctor.js --env test/fixtures/missing-vars.env --example test/fixtures/valid.env.example

# Lint (ESLint 9 flat config)
npm run lint

# Format
npm run format

# Validate package before publish (publint + arethetypeswrong)
npm run validate
```

---

## Notes for Agent

1. **No external CLI framework** - Use Node.js built-in `parseArgs` from `node:util`
2. **No dotenv dependency** - Implement parser from scratch (it's simple)
3. **Colors** - Use ANSI escape codes directly or `node:util` styleText (Node 20+)
4. **Focus on DX** - Clear error messages, helpful output
5. **Test coverage** - Cover all parser edge cases
6. **Zero runtime dependencies** - Keep it lightweight
7. **Use tsdown, NOT tsup** - tsup is no longer maintained, tsdown is the successor
8. **Pure ESM** - No CJS support needed, Node 20+ has native ESM support
9. **Validate before publish** - Always run `publint` and `attw` before publishing
10. **ESLint flat config** - Use `eslint.config.js` (not `.eslintrc.*`)

---

## References (2025 Best Practices)

- [tsdown - The Elegant Bundler for Libraries](https://tsdown.dev/)
- [publint - Lint npm packages](https://publint.dev/)
- [arethetypeswrong - Check TypeScript types](https://arethetypeswrong.github.io/)
- [Pure ESM package guide](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
- [Node.js Packages Documentation](https://nodejs.org/api/packages.html)

---

*Specification version: 2.0.0*
*Updated: December 2025*
*Based on npm best practices research December 2025*
