<h1 align="center">env-doctor</h1>
<h3 align="center">Validate, audit, and sync .env files</h3>

<p align="center">
  <em>Zero-dependency CLI tool to check .env against .env.example</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/env-doctor"><img src="https://img.shields.io/npm/v/env-doctor.svg" alt="npm version" /></a>
  <img src="https://github.com/fracabu/env-doctor/actions/workflows/ci.yml/badge.svg" alt="CI" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-green.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript" />
</p>

<p align="center">
  :gb: <a href="#english">English</a> | :it: <a href="#italiano">Italiano</a>
</p>

---

## Overview

<!-- ![env-doctor Overview](assets/env-doctor-overview.png) -->

---

<a name="english"></a>
## :gb: English

### Why env-doctor?

| Problem | Impact |
|---------|--------|
| Missing variables | Deploy fails, app crashes |
| Undocumented variables | Team confusion, security risks |
| Empty values | Silent failures |
| Sync issues | "Works on my machine" |

### Features

- **Zero dependencies** - Lightweight and fast
- **Pure ESM** - Modern JavaScript
- **TypeScript** - Full type definitions
- **CI/CD ready** - Exit codes for automation
- **Multiple formats** - Human-readable or JSON
- **Library API** - Use programmatically

### Install

```bash
npx env-doctor        # Run directly
npm install -g env-doctor  # Or install globally
```

### Usage

```bash
env-doctor                    # Basic check
env-doctor --ci               # CI mode (exit 1 on missing)
env-doctor --json             # JSON output
env-doctor --env .env.prod    # Custom paths
```

### Library API

```typescript
import { validate } from 'env-doctor'

const result = await validate({
  envPath: '.env',
  examplePath: '.env.example'
})

console.log(result.missing)  // ['DATABASE_URL', 'API_SECRET']
console.log(result.extra)    // ['OLD_VAR']
```

---

<a name="italiano"></a>
## :it: Italiano

### Perche env-doctor?

| Problema | Impatto |
|----------|---------|
| Variabili mancanti | Deploy fallisce, app crasha |
| Variabili non documentate | Confusione team, rischi sicurezza |
| Valori vuoti | Fallimenti silenziosi |
| Problemi sync | "Funziona sulla mia macchina" |

### Funzionalita

- **Zero dipendenze** - Leggero e veloce
- **Pure ESM** - JavaScript moderno
- **TypeScript** - Definizioni di tipo complete
- **CI/CD ready** - Exit code per automazione
- **Formati multipli** - Leggibile o JSON
- **API Library** - Usa programmaticamente

### Installazione

```bash
npx env-doctor        # Esegui direttamente
npm install -g env-doctor  # O installa globalmente
```

### Utilizzo

```bash
env-doctor                    # Check base
env-doctor --ci               # Modalita CI (exit 1 se mancanti)
env-doctor --json             # Output JSON
env-doctor --env .env.prod    # Percorsi custom
```

### CI/CD Integration

```yaml
# GitHub Actions
- name: Validate env
  run: npx env-doctor --ci
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All checks passed |
| `1` | Missing variables (CI mode) |
| `2` | File not found |

## License

MIT

---

<p align="center">
  <a href="https://github.com/fracabu">
    <img src="https://img.shields.io/badge/Made_by-fracabu-8B5CF6?style=flat-square" alt="Made by fracabu" />
  </a>
</p>
