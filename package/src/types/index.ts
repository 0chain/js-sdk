const LOG_CODES = [
  'WASM_LOADING', // Info
  'WASM_LOADED', // Info
  'OUTDATED_WASM_VERSION', // Warn
  'WASM_TYPE_MISMATCH_RETRY', // Warn
  'INVALID_WASM_CONFIG', // Fatal
  'WASM_TYPE_MISMATCH', // Fatal
] as const

type LogData = {
  message: string
  data?: any
  code: (typeof LOG_CODES)[number]
}

export type OnLog = (
  type: 'info' | 'error' | 'warn' | 'debug',
  logData: LogData
) => void
