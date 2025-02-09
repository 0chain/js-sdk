/**
 * Converts a hexadecimal string to a Uint8Array.
 *
 * @param str The hexadecimal string to convert.
 * @returns The Uint8Array bytes representation of the hexadecimal string.
 */
export const hexStringToByte = (str: string): Uint8Array<ArrayBuffer> => {
  if (!str) return new Uint8Array()

  const a: number[] = []
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substring(i, i + 2), 16))
  }
  return new Uint8Array(a)
}

/**
 * Sleep is used when awaiting for Go Wasm to initialize.
 * It uses the lowest possible sane delay time (via requestAnimationFrame).
 * However, if the window is not focused, requestAnimationFrame never returns.
 * A timeout will ensure to be called after 50 ms, regardless of whether or not
 * the tab is in focus.
 */
export const sleep = (ms = 1000): Promise<number | void> => {
  return new Promise<number | void>(resolve => {
    requestAnimationFrame(resolve)
    setTimeout(resolve, ms)
  })
}

export const getBls = async (): Promise<any> => {
  const bls = window.bls
  if (!bls?.mod?.calledRun) await bls?.init(bls.BN254)
  return bls
}

/** Converts SAS token to ZCN */
export const sasTokenToZcn = (token = 0): number => {
  const zcn = token / Math.pow(10, 10)
  return parseFloat(String(zcn))
}

/** 
 * Converts ZCN to SAS token 
 * Note: SAS can never be a float number
*/
export const zcnToSasToken = (zcn = 0): number => {
  const sasToken = zcn * Math.pow(10, 10)
  return parseInt(String(sasToken))
}
