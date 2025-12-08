import { test } from 'tap'
import { validate } from '../src/validator.js'

test('validate - all vars present', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/valid.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.equal(result.valid, true)
  t.equal(result.missing.length, 0)
  t.equal(result.extra.length, 0)
  t.equal(result.empty.length, 0)
})

test('validate - missing vars', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/missing-vars.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.equal(result.valid, false)
  t.equal(result.missing.length, 2)
  t.ok(result.missing.includes('DATABASE_URL'))
  t.ok(result.missing.includes('API_KEY'))
})

test('validate - extra vars (warning, still valid)', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/extra-vars.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.equal(result.valid, true) // Extra vars don't fail validation
  t.equal(result.extra.length, 2)
  t.ok(result.extra.includes('OLD_DEPRECATED_VAR'))
  t.ok(result.extra.includes('ANOTHER_EXTRA'))
})

test('validate - empty vars (warning)', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/empty-vars.env',
    examplePath: './test/fixtures/valid.env.example'
  })
  t.equal(result.valid, true) // Empty vars don't fail validation
  t.equal(result.empty.length, 2)
  t.ok(result.empty.includes('DATABASE_URL'))
  t.ok(result.empty.includes('NODE_ENV'))
})

test('validate - env file not found', async (t) => {
  await t.rejects(
    validate({
      envPath: './nonexistent.env',
      examplePath: './test/fixtures/valid.env.example'
    }),
    /Failed to read env file/
  )
})

test('validate - example file not found', async (t) => {
  await t.rejects(
    validate({
      envPath: './test/fixtures/valid.env',
      examplePath: './nonexistent.env.example'
    }),
    /Failed to read example file/
  )
})

test('validate - errors array populated correctly', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/missing-vars.env',
    examplePath: './test/fixtures/valid.env.example'
  })

  const missingErrors = result.errors.filter(e => e.type === 'missing')
  t.equal(missingErrors.length, 2)
  t.ok(missingErrors.some(e => e.variable === 'DATABASE_URL'))
  t.ok(missingErrors.some(e => e.variable === 'API_KEY'))
})

test('validate - envVars and exampleVars populated', async (t) => {
  const result = await validate({
    envPath: './test/fixtures/valid.env',
    examplePath: './test/fixtures/valid.env.example'
  })

  t.equal(result.envVars['PORT'], '3000')
  t.equal(result.exampleVars['PORT'], '3000')
  t.equal(result.envVars['DATABASE_URL'], 'postgres://localhost:5432/mydb')
  t.equal(result.exampleVars['DATABASE_URL'], 'your_database_url_here')
})
