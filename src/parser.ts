import { readFile } from 'node:fs/promises'
import type { ParseResult, ParsedLine } from './types.ts'

/**
 * Parse a single line from an env file
 */
export function parseLine(line: string, lineNumber: number): ParsedLine {
  const raw = line
  const trimmed = line.trim()

  // Empty line
  if (trimmed === '') {
    return { lineNumber, raw, isComment: false, isEmpty: true }
  }

  // Comment line
  if (trimmed.startsWith('#')) {
    return { lineNumber, raw, isComment: true, isEmpty: false }
  }

  // Remove 'export ' prefix if present
  let content = trimmed
  if (content.startsWith('export ')) {
    content = content.slice(7)
  }

  // Find the first '=' to split key and value
  const eqIndex = content.indexOf('=')
  if (eqIndex === -1) {
    // Invalid line, treat as empty
    return { lineNumber, raw, isComment: false, isEmpty: true }
  }

  const key = content.slice(0, eqIndex).trim()
  let value = content.slice(eqIndex + 1)

  // Parse the value
  value = parseValue(value)

  return {
    lineNumber,
    raw,
    key,
    value,
    isComment: false,
    isEmpty: false
  }
}

/**
 * Parse the value portion of a KEY=value line
 * Handles quotes, inline comments, and whitespace
 */
function parseValue(rawValue: string): string {
  let value = rawValue

  // Check for quoted values
  const firstChar = value.charAt(0)
  if (firstChar === '"' || firstChar === "'") {
    // Find matching closing quote
    const closeIndex = findClosingQuote(value, firstChar)
    if (closeIndex !== -1) {
      // Extract value between quotes
      value = value.slice(1, closeIndex)
      // Handle escape sequences in double-quoted strings
      if (firstChar === '"') {
        value = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      }
      return value
    }
  }

  // Not quoted - handle inline comments and trim
  // Inline comment: space followed by #
  const commentIndex = value.indexOf(' #')
  if (commentIndex !== -1) {
    value = value.slice(0, commentIndex)
  }

  return value.trim()
}

/**
 * Find the closing quote, handling escaped quotes
 */
function findClosingQuote(str: string, quote: string): number {
  let i = 1
  while (i < str.length) {
    if (str[i] === '\\' && str[i + 1] === quote) {
      // Skip escaped quote
      i += 2
      continue
    }
    if (str[i] === quote) {
      return i
    }
    i++
  }
  return -1
}

/**
 * Parse an entire env file
 */
export async function parse(filePath: string): Promise<ParseResult> {
  const content = await readFile(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)
  const vars: Record<string, string> = {}
  const parsedLines: ParsedLine[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue

    const parsed = parseLine(line, i + 1)
    parsedLines.push(parsed)

    if (parsed.key !== undefined && parsed.value !== undefined) {
      vars[parsed.key] = parsed.value
    }
  }

  return { vars, lines: parsedLines }
}
