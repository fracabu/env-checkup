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
