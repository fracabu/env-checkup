import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validate } from './validator.ts'
import { report } from './reporter.ts'
import type { CliOptions } from './types.ts'

// Get package version
function getVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const pkgPath = join(__dirname, '..', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }
    return pkg.version
  } catch {
    return '0.0.0'
  }
}

const VERSION = getVersion()

const HELP = `
env-doctor v${VERSION}

CLI tool to validate and audit .env files against .env.example

Usage:
  env-doctor [options]

Options:
  -e, --env <path>      Path to env file (default: .env)
  -x, --example <path>  Path to example file (default: .env.example)
  --ci                  CI mode: exit 1 on any error
  -j, --json            Output as JSON
  -q, --quiet           Only show errors
  --no-color            Disable colored output
  -h, --help            Show help
  -v, --version         Show version

Examples:
  env-doctor
  env-doctor --env .env.production --example .env.example
  env-doctor --ci --json
`

function parseCliArgs(): CliOptions {
  const { values } = parseArgs({
    options: {
      env: { type: 'string', short: 'e', default: '.env' },
      example: { type: 'string', short: 'x', default: '.env.example' },
      ci: { type: 'boolean', default: false },
      json: { type: 'boolean', short: 'j', default: false },
      quiet: { type: 'boolean', short: 'q', default: false },
      'no-color': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false }
    },
    strict: true
  })

  return {
    env: values.env ?? '.env',
    example: values.example ?? '.env.example',
    ci: values.ci ?? false,
    json: values.json ?? false,
    quiet: values.quiet ?? false,
    noColor: values['no-color'] ?? false
  }
}

async function main(): Promise<void> {
  // Check for help and version first
  const args = process.argv.slice(2)
  if (args.includes('-h') || args.includes('--help')) {
    console.log(HELP)
    process.exit(0)
  }
  if (args.includes('-v') || args.includes('--version')) {
    console.log(VERSION)
    process.exit(0)
  }

  let options: CliOptions
  try {
    options = parseCliArgs()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error: ${message}`)
    console.error('Use --help for usage information')
    process.exit(2)
  }

  // Detect NO_COLOR environment variable
  if (process.env['NO_COLOR'] !== undefined) {
    options.noColor = true
  }

  // Header (unless json or quiet)
  if (!options.json && !options.quiet) {
    console.log(`env-doctor v${VERSION}`)
    console.log('')
    console.log(`Checking ${options.env} against ${options.example}...`)
  }

  try {
    const result = await validate({
      envPath: options.env,
      examplePath: options.example
    })

    const output = report(result, {
      format: options.json ? 'json' : 'text',
      noColor: options.noColor,
      quiet: options.quiet
    })

    console.log(output)

    // Exit code
    if (options.ci && !result.valid) {
      process.exit(1)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (options.json) {
      console.log(JSON.stringify({ error: message }, null, 2))
    } else {
      console.error(`Error: ${message}`)
    }
    process.exit(2)
  }
}

main()
