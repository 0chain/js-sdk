export const errorOut = (method: string, e: unknown): never => {
  console.error(`${method}: `, e)
  if (typeof e === 'string') throw new Error(e)
  else if (e instanceof Error) throw e
  else throw new Error(`${method}: Unknown error`)
}

export const truncateAddress = (
  addressString = '',
  start = 5,
  flag = true,
  end = -4,
  showDots = true
): string => {
  if (addressString?.length <= start + 3 + Math.abs(end)) return addressString
  if (flag) {
    return `${addressString?.slice(0, start)}...${addressString?.slice(end)}`
  } else {
    return `${addressString?.slice(0, start)}${showDots ? '...' : ''}`
  }
}
