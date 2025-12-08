import type { ValidationResult, ReportOptions } from './types.ts'

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
}

function color(text: string, colorCode: string, noColor: boolean): string {
  if (noColor) return text
  return `${colorCode}${text}${colors.reset}`
}

/**
 * Format validation result for output
 */
export function report(result: ValidationResult, options: ReportOptions): string {
  if (options.format === 'json') {
    return reportJson(result)
  }
  return reportText(result, options)
}

/**
 * JSON output format
 */
function reportJson(result: ValidationResult): string {
  const totalExample = Object.keys(result.exampleVars).length
  const validCount = totalExample - result.missing.length

  const output = {
    valid: result.valid,
    summary: {
      total: totalExample,
      valid: validCount,
      missing: result.missing.length,
      extra: result.extra.length,
      empty: result.empty.length
    },
    missing: result.missing,
    extra: result.extra,
    empty: result.empty,
    variables: result.envVars
  }

  return JSON.stringify(output, null, 2)
}

/**
 * Text output format with colors
 */
function reportText(result: ValidationResult, options: ReportOptions): string {
  const { noColor, quiet } = options
  const lines: string[] = []

  const totalExample = Object.keys(result.exampleVars).length
  const validCount = totalExample - result.missing.length

  // Missing variables (errors)
  if (result.missing.length > 0) {
    lines.push('')
    lines.push(
      color(`✗ Missing (${result.missing.length}):`, colors.red, noColor)
    )
    for (const key of result.missing) {
      lines.push(`  ${color('•', colors.red, noColor)} ${key}`)
    }
  }

  // In quiet mode, only show errors (missing)
  if (!quiet) {
    // Extra variables (warnings)
    if (result.extra.length > 0) {
      lines.push('')
      lines.push(
        color(`⚠ Extra (${result.extra.length}):`, colors.yellow, noColor)
      )
      for (const key of result.extra) {
        lines.push(`  ${color('•', colors.yellow, noColor)} ${key}`)
      }
    }

    // Empty variables (warnings)
    if (result.empty.length > 0) {
      lines.push('')
      lines.push(
        color(`⚠ Empty (${result.empty.length}):`, colors.yellow, noColor)
      )
      for (const key of result.empty) {
        lines.push(`  ${color('•', colors.yellow, noColor)} ${key}`)
      }
    }

    // Summary
    lines.push('')
    lines.push('Summary:')
    lines.push(
      `  ${color('✓', colors.green, noColor)} Valid: ${validCount} variables`
    )
    if (result.missing.length > 0) {
      lines.push(
        `  ${color('✗', colors.red, noColor)} Missing: ${result.missing.length} variables`
      )
    }
    if (result.extra.length > 0) {
      lines.push(
        `  ${color('⚠', colors.yellow, noColor)} Extra: ${result.extra.length} variables`
      )
    }
    if (result.empty.length > 0) {
      lines.push(
        `  ${color('⚠', colors.yellow, noColor)} Empty: ${result.empty.length} variables`
      )
    }
  }

  // Result
  lines.push('')
  if (result.valid) {
    lines.push(color('Result: PASSED', colors.green + colors.bold, noColor))
  } else {
    lines.push(
      color(
        'Result: FAILED (missing required variables)',
        colors.red + colors.bold,
        noColor
      )
    )
  }

  return lines.join('\n')
}
