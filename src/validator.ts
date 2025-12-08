import { parse } from './parser.ts'
import type { ValidateOptions, ValidationResult, ValidationError } from './types.ts'

const DEFAULT_ENV_PATH = '.env'
const DEFAULT_EXAMPLE_PATH = '.env.example'

/**
 * Validate an env file against an example file
 */
export async function validate(options: ValidateOptions = {}): Promise<ValidationResult> {
  const envPath = options.envPath ?? DEFAULT_ENV_PATH
  const examplePath = options.examplePath ?? DEFAULT_EXAMPLE_PATH

  const errors: ValidationError[] = []

  // Parse both files
  let envResult
  let exampleResult

  try {
    envResult = await parse(envPath)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to read env file "${envPath}": ${message}`)
  }

  try {
    exampleResult = await parse(examplePath)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to read example file "${examplePath}": ${message}`)
  }

  const envVars = envResult.vars
  const exampleVars = exampleResult.vars

  const envKeys = new Set(Object.keys(envVars))
  const exampleKeys = new Set(Object.keys(exampleVars))

  // Find missing: keys in example but not in env
  const missing: string[] = []
  for (const key of exampleKeys) {
    if (!envKeys.has(key)) {
      missing.push(key)
      errors.push({
        type: 'missing',
        variable: key,
        message: `Variable "${key}" is defined in ${examplePath} but missing in ${envPath}`,
        file: envPath
      })
    }
  }

  // Find extra: keys in env but not in example
  const extra: string[] = []
  for (const key of envKeys) {
    if (!exampleKeys.has(key)) {
      extra.push(key)
      errors.push({
        type: 'extra',
        variable: key,
        message: `Variable "${key}" is defined in ${envPath} but not documented in ${examplePath}`,
        file: envPath
      })
    }
  }

  // Find empty: keys in env with empty values
  const empty: string[] = []
  for (const [key, value] of Object.entries(envVars)) {
    if (value === '') {
      empty.push(key)
      errors.push({
        type: 'empty',
        variable: key,
        message: `Variable "${key}" has an empty value in ${envPath}`,
        file: envPath
      })
    }
  }

  // Sort arrays for consistent output
  missing.sort()
  extra.sort()
  empty.sort()

  // Valid if no missing variables
  const valid = missing.length === 0

  return {
    valid,
    missing,
    extra,
    empty,
    envVars,
    exampleVars,
    errors
  }
}
