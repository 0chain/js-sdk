// TODO: not used in webapps: splitKeys, registerAuthorizer, registerAuthCommon, callAuth
import { getWasm } from '@/setup/wasm'
import type { ActiveWallet, NetworkDomain } from '@/types/wallet'

/**
 * Split keys from the primary master key
 *
 * splitKeys splits the primary master key into n number of keys
 */
export const splitKeys = async ({
  domain,
  wallet,
  privateKey,
  numSplits,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Primary master key */
  privateKey: string
  /** Number of keys to split into */
  numSplits: number
}) => {
  const goWasm = await getWasm({ domain, wallet })
  const resp = await goWasm.sdk.splitKeys(privateKey, numSplits)
  return resp as string
}

/**
 * setWalletInfo sets the Split key wallet info
 *
 * setWalletInfo should be set before any transaction or client specific APIs.
 */
export const setWalletInfo = async ({
  domain,
  wallet,
  jsonWallet,
  splitKeyWallet = false,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** JSON format of wallet */
  jsonWallet: string
  /**
   * `true` If wallet keys is split.
   *
   * splitKeyWallet parameter is valid only if SignatureScheme is `BLS0Chain`.
   *
   * @default false
   */
  splitKeyWallet?: boolean
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.setWalletInfo(jsonWallet, splitKeyWallet)
}

/** setAuthUrl will be called by app to set zauth URL to SDK. */
export const setAuthUrl = async ({
  domain,
  wallet,
  url,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** URL of zAuth server */
  url: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.setAuthUrl(url)
}

/**
 * registerAuthorizer registers the callback function to authorize the transaction.
 *
 * It stores the callback function in the global variable `authCallback`
 */
export const registerAuthorizer = async ({
  domain,
  wallet,
  authTxnCallback,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  authTxnCallback: (message: string) => void
}) => {
  const goWasm = await getWasm({ domain, wallet })
  const registerAuthorizer = await goWasm.sdk.registerAuthorizer
  await registerAuthorizer(authTxnCallback)
}

export const registerAuthCommon = async ({
  domain,
  wallet,
  authTxnCallback,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  authTxnCallback: (message: string) => void
}) => {
  const goWasm = await getWasm({ domain, wallet })
  const registerAuthCommon = await goWasm.sdk.registerAuthCommon
  await registerAuthCommon(authTxnCallback)
}

/**
 * callAuth calls the authorization callback function and provides the message to pass to it.
 *
 * The message is passed as the first argument to the JS calling.
 */
// export const callAuth = async ({
//   domain,
//   wallet,
// }: {
//   domain: NetworkDomain
//   wallet: ActiveWallet
// }) => {
//   const goWasm = await getWasm({ domain, wallet })
//   const callAuth = await goWasm.sdk.callAuth
//   return callAuth(message) // TODO: is this correct? this method is not used in webapps
// }

/** authResponse Publishes the response to the authorization request. */
export const authResponse = async ({
  domain,
  wallet,
  response,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  response: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.authResponse(response)
}

export const registerZauthServer = async ({
  domain,
  wallet,
  serverAddress,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  serverAddress: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.registerZauthServer(serverAddress)
}

export const zauthRetrieveKey = async ({
  domain,
  wallet,
  clientId,
  peerPublicKey,
  serverAddress,
  token,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Wallet ID */
  clientId: string
  /** Peer public key */
  peerPublicKey: string
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  const resp = await goWasm.sdk.zauthRetrieveKey(
    clientId,
    peerPublicKey,
    serverAddress,
    token
  )

  return resp as string
}
