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

type DecodedAuthTicket = {
  fileName?: string
  walletId?: string
  lookupHash?: string
  referenceType?: string
  allocationId?: string
  isEncrypted?: boolean
}
/** decodeAuthTicket decodes the Authticket */
export const decodeAuthTicket = (authTicket: string): DecodedAuthTicket => {
  if (!authTicket) return {}
  try {
    const file = JSON.parse(decodeURIComponent(escape(atob(authTicket))))
    return {
      fileName: file.file_name,
      walletId: file.owner_id || file.client_id,
      lookupHash: file.file_path_hash,
      referenceType: file.reference_type,
      allocationId: file.allocation_id,
      isEncrypted: file.encrypted,
    }
  } catch (e) {
    console.error('Failed decoding authticket ', e)
    return {}
  }
}

// type AuthToken = {
//   recipient_public_key: string
//   marker: string
//   tokens: number
// }
// /** 
//  * decodeAuthTicket decodes the auth ticket and returns the recipient public key and the tokens
//  * @deprecated 
//  */
// export const decodeAuthTicket = async ({
//   domain,
//   wallet,
//   authTicket,
// }: {
//   domain: NetworkDomain
//   wallet: ActiveWallet
//   authTicket: string
// }): Promise<AuthToken> => {
//   const goWasm = await getWasm({ domain, wallet })
//   const resp = await goWasm.sdk.decodeAuthTicket(authTicket)
//   return resp
// }
