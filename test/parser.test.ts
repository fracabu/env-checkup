import { test } from 'tap'
import { parse, parseLine } from '../src/parser.js'

test('parseLine - basic key=value', async (t) => {
  const result = parseLine('DATABASE_URL=postgres://localhost', 1)
  t.equal(result.key, 'DATABASE_URL')
  t.equal(result.value, 'postgres://localhost')
  t.equal(result.isComment, false)
  t.equal(result.isEmpty, false)
})

test('parseLine - quoted value with spaces (double quotes)', async (t) => {
  const result = parseLine('MESSAGE="Hello World"', 1)
  t.equal(result.key, 'MESSAGE')
  t.equal(result.value, 'Hello World')
})

test('parseLine - quoted value with spaces (single quotes)', async (t) => {
  const result = parseLine("PASSWORD='my secret'", 1)
  t.equal(result.key, 'PASSWORD')
  t.equal(result.value, 'my secret')
})

test('parseLine - empty value', async (t) => {
  const result = parseLine('EMPTY_VAR=', 1)
  t.equal(result.key, 'EMPTY_VAR')
  t.equal(result.value, '')
})

test('parseLine - empty quoted value', async (t) => {
  const result = parseLine('EMPTY_VAR=""', 1)
  t.equal(result.key, 'EMPTY_VAR')
  t.equal(result.value, '')
})

test('parseLine - comment line', async (t) => {
  const result = parseLine('# This is a comment', 1)
  t.equal(result.isComment, true)
  t.equal(result.key, undefined)
  t.equal(result.value, undefined)
})

test('parseLine - empty line', async (t) => {
  const result = parseLine('', 1)
  t.equal(result.isEmpty, true)
  t.equal(result.isComment, false)
})

test('parseLine - whitespace only line', async (t) => {
  const result = parseLine('   ', 1)
  t.equal(result.isEmpty, true)
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

test('parseLine - inline comment without space before hash', async (t) => {
  // Hash without preceding space should be part of value
  const result = parseLine('URL=http://example.com#anchor', 1)
  t.equal(result.key, 'URL')
  t.equal(result.value, 'http://example.com#anchor')
})

test('parseLine - value with equals sign', async (t) => {
  const result = parseLine('CONNECTION=host=localhost;port=5432', 1)
  t.equal(result.key, 'CONNECTION')
  t.equal(result.value, 'host=localhost;port=5432')
})

test('parseLine - escape sequences in double quotes', async (t) => {
  const result = parseLine('MULTILINE="line1\\nline2"', 1)
  t.equal(result.key, 'MULTILINE')
  t.equal(result.value, 'line1\nline2')
})

test('parseLine - escaped quote in double quotes', async (t) => {
  const result = parseLine('QUOTE="say \\"hello\\""', 1)
  t.equal(result.key, 'QUOTE')
  t.equal(result.value, 'say "hello"')
})

test('parse - full file', async (t) => {
  const result = await parse('./test/fixtures/valid.env')
  t.equal(result.vars['PORT'], '3000')
  t.equal(result.vars['DATABASE_URL'], 'postgres://localhost:5432/mydb')
  t.equal(result.vars['API_KEY'], 'sk_test_123456')
  t.equal(result.vars['NODE_ENV'], 'development')
  t.equal(Object.keys(result.vars).length, 4)
})

test('parse - file with comments', async (t) => {
  const result = await parse('./test/fixtures/missing-vars.env')
  t.equal(result.vars['PORT'], '3000')
  t.equal(result.vars['NODE_ENV'], 'development')
  t.equal(Object.keys(result.vars).length, 2)
})

test('parse - file not found', async (t) => {
  await t.rejects(parse('./nonexistent.env'))
})
