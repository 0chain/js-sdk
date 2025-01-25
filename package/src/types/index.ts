export type OnLog = (
  type: 'info' | 'error' | 'warn' | 'debug',
  message: string,
  data?: any
) => void
