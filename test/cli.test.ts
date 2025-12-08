import { test } from 'tap'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI = join(__dirname, '..', 'bin', 'env-doctor.js')

function runCli(args: string[] = []): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync('node', [CLI, ...args], {
    encoding: 'utf8',
    cwd: join(__dirname, '..')
  })
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status
  }
}

test('cli - help flag', async (t) => {
  const result = runCli(['--help'])
  t.equal(result.status, 0)
  t.ok(result.stdout.includes('Usage:'))
  t.ok(result.stdout.includes('--env'))
  t.ok(result.stdout.includes('--example'))
})

test('cli - help flag short', async (t) => {
  const result = runCli(['-h'])
  t.equal(result.status, 0)
  t.ok(result.stdout.includes('Usage:'))
})

test('cli - version flag', async (t) => {
  const result = runCli(['--version'])
  t.equal(result.status, 0)
  t.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/)
})

test('cli - version flag short', async (t) => {
  const result = runCli(['-v'])
  t.equal(result.status, 0)
  t.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/)
})

test('cli - valid env returns exit 0', async (t) => {
  const result = runCli([
    '--env', './test/fixtures/valid.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 0)
  t.ok(result.stdout.includes('PASSED'))
})

test('cli - missing vars without CI mode returns exit 0', async (t) => {
  const result = runCli([
    '--env', './test/fixtures/missing-vars.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 0) // Without --ci, still exits 0
  t.ok(result.stdout.includes('FAILED'))
  t.ok(result.stdout.includes('Missing'))
})

test('cli - missing vars in CI mode returns exit 1', async (t) => {
  const result = runCli([
    '--ci',
    '--env', './test/fixtures/missing-vars.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 1)
})

test('cli - json output', async (t) => {
  const result = runCli([
    '--json',
    '--env', './test/fixtures/valid.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 0)
  const json = JSON.parse(result.stdout)
  t.ok('valid' in json)
  t.ok('missing' in json)
  t.ok('summary' in json)
  t.equal(json.valid, true)
})

test('cli - json output with missing vars', async (t) => {
  const result = runCli([
    '--json',
    '--env', './test/fixtures/missing-vars.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 0)
  const json = JSON.parse(result.stdout)
  t.equal(json.valid, false)
  t.ok(json.missing.includes('DATABASE_URL'))
  t.ok(json.missing.includes('API_KEY'))
})

test('cli - quiet mode shows only errors', async (t) => {
  const result = runCli([
    '--quiet',
    '--env', './test/fixtures/extra-vars.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 0)
  // Should not show extra/empty warnings in quiet mode
  t.notOk(result.stdout.includes('Extra'))
  t.ok(result.stdout.includes('PASSED'))
})

test('cli - quiet mode with missing vars', async (t) => {
  const result = runCli([
    '--quiet',
    '--env', './test/fixtures/missing-vars.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 0)
  t.ok(result.stdout.includes('Missing'))
  t.ok(result.stdout.includes('FAILED'))
})

test('cli - file not found returns exit 2', async (t) => {
  const result = runCli([
    '--env', './nonexistent.env',
    '--example', './test/fixtures/valid.env.example'
  ])
  t.equal(result.status, 2)
})

test('cli - short flags', async (t) => {
  const result = runCli([
    '-e', './test/fixtures/valid.env',
    '-x', './test/fixtures/valid.env.example',
    '-j'
  ])
  t.equal(result.status, 0)
  const json = JSON.parse(result.stdout)
  t.equal(json.valid, true)
})
