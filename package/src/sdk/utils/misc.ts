export const errorOut = (method: string, e: unknown): never => {
  console.error(`${method}: `, e)
  if (typeof e === 'string') throw new Error(e)
  else if (e instanceof Error) throw e
  else throw new Error(`${method}: Unknown error`)
}
