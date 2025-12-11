# env-doctor

[![npm version](https://img.shields.io/npm/v/env-doctor.svg)](https://www.npmjs.com/package/env-doctor)
[![CI](https://github.com/fracabu/env-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/fracabu/env-doctor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

> A zero-dependency CLI tool to validate, audit, and sync `.env` files against `.env.example`

## Why env-doctor?

Environment variable misconfigurations are a common source of deployment failures and debugging headaches:

| Problem | Impact |
|---------|--------|
| Missing variables | Deploy fails, app crashes at runtime |
| Undocumented variables | Team confusion, security risks |
| Empty values | Silent failures, unexpected behavior |
| Sync issues | "Works on my machine" syndrome |

**env-doctor** catches all of these issues with a single command.

## Features

- **Zero dependencies** - Lightweight and fast
- **Pure ESM** - Modern JavaScript module system
- **TypeScript** - Full type definitions included
- **CI/CD ready** - Exit codes for automation
- **Multiple output formats** - Human-readable or JSON
- **Library API** - Use programmatically in your code

## Installation

```bash
# Run directly with npx (no install needed)
npx env-doctor

# Or install globally
npm install -g env-doctor

# Or as a dev dependency
npm install -D env-doctor
```

## Quick Start

```bash
# Basic usage - checks .env against .env.example
env-doctor

# Output:
# env-doctor v1.0.0
# Checking .env against .env.example...
#
# ✗ Missing (2):
#   • DATABASE_URL
#   • API_SECRET
#
# ⚠ Extra (1):
#   • OLD_DEPRECATED_VAR
#
# Result: FAILED (missing required variables)
```

## CLI Usage

```bash
# Custom file paths
env-doctor --env .env.production --example .env.template

# CI mode - exit code 1 on missing variables
env-doctor --ci

# JSON output for scripting
env-doctor --json

# Quiet mode - errors only
env-doctor --quiet

# Combine options
env-doctor --ci --json --env .env.staging
```

### Options

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--env` | `-e` | `.env` | Path to environment file |
| `--example` | `-x` | `.env.example` | Path to example/template file |
| `--ci` | | `false` | CI mode: exit 1 on missing variables |
| `--json` | `-j` | `false` | Output as JSON |
| `--quiet` | `-q` | `false` | Only show errors |
| `--no-color` | | `false` | Disable colored output |
| `--help` | `-h` | | Show help |
| `--version` | `-v` | | Show version |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All checks passed |
| `1` | Missing variables found (CI mode only) |
| `2` | File not found or parse error |

## Library API

Use env-doctor programmatically in your Node.js applications:

```typescript
import { validate, parse } from 'env-doctor'

// Full validation
const result = await validate({
  envPath: '.env',
  examplePath: '.env.example'
})

console.log(result.valid)      // boolean
console.log(result.missing)    // string[] - vars in example but not in env
console.log(result.extra)      // string[] - vars in env but not in example
console.log(result.empty)      // string[] - vars with empty values

// Just parse a file
const { vars } = await parse('.env')
console.log(vars) // { DATABASE_URL: '...', PORT: '3000' }
```

### TypeScript Types

```typescript
import type {
  ValidationResult,
  ValidateOptions,
  ParseResult
} from 'env-doctor'
```

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  validate-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate environment variables
        run: npx env-doctor --ci
```

### Pre-commit Hook

```json
{
  "scripts": {
    "precommit": "env-doctor --ci"
  }
}
```

### GitLab CI

```yaml
validate-env:
  script:
    - npx env-doctor --ci
```

## Parser Features

env-doctor handles all common `.env` file formats:

```bash
# Basic key=value
DATABASE_URL=postgres://localhost:5432/mydb

# Quoted values (preserves spaces)
MESSAGE="Hello World"
PASSWORD='secret with spaces'

# Empty values (detected as warning)
OPTIONAL_VAR=

# Comments
# This is a comment
API_KEY=secret123  # Inline comment

# Export prefix (stripped automatically)
export NODE_ENV=production

# Values with special characters
CONNECTION_STRING="host=localhost;port=5432"
```

## JSON Output Format

```json
{
  "valid": false,
  "summary": {
    "total": 10,
    "valid": 8,
    "missing": 2,
    "extra": 1,
    "empty": 1
  },
  "missing": ["DATABASE_URL", "API_SECRET"],
  "extra": ["OLD_VAR"],
  "empty": ["OPTIONAL"],
  "variables": {
    "PORT": "3000",
    "NODE_ENV": "development"
  }
}
```

## Requirements

- Node.js 20.0.0 or higher
- ESM support (native in Node.js 20+)

## Development

```bash
# Clone the repository
git clone https://github.com/fracabu/env-doctor.git
cd env-doctor

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.7
- **Module System**: Pure ESM
- **Build Tool**: tsdown (Rolldown-powered)
- **Test Framework**: tap
- **Linting**: ESLint 9 (flat config)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Francesco Capurso](https://github.com/fracabu)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/fracabu">fracabu</a>
</p>

