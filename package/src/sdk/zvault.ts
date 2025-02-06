// TODO: not used in webapps: zvaultStoreKey, zvaultRevokeKey, zvaultDeletePrimaryKey
import { getWasm } from '@/setup/wasm'
import type { ActiveWallet, NetworkDomain } from '@/types/wallet'

/** zvaultNewWallet generates new wallet */
export const zvaultNewWallet = async ({
  domain,
  wallet,
  serverAddress,
  token,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultNewWallet(serverAddress, token)
}

/** zvaultNewSplit generates new split key for saved wallet */
export const zvaultNewSplit = async ({
  domain,
  wallet,
  clientId,
  serverAddress,
  token,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Wallet ID */
  clientId: string
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultNewSplit(clientId, serverAddress, token)
}

export const zvaultRetrieveRestrictions = async ({
  domain,
  wallet,
  peerPublicKey,
  serverAddress,
  token,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Peer public key */
  peerPublicKey: string
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  const resp = await goWasm.sdk.zvaultRetrieveRestrictions(
    peerPublicKey,
    serverAddress,
    token
  )

  return resp as string
}

export const zvaultUpdateRestrictions = async ({
  domain,
  wallet,
  clientId,
  peerPublicKey,
  serverAddress,
  token,
  restrictions,
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
  restrictions: string[]
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultUpdateRestrictions(
    clientId,
    peerPublicKey,
    serverAddress,
    token,
    restrictions
  )
}

export const zvaultStoreKey = async ({
  domain,
  wallet,
  serverAddress,
  token,
  privateKey,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
  /** Private key */
  privateKey: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultStoreKey(serverAddress, token, privateKey)
}

export const zvaultRetrieveKeys = async ({
  domain,
  wallet,
  serverAddress,
  token,
  clientId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
  /** Wallet ID */
  clientId: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultRetrieveKeys(serverAddress, token, clientId) as string
}

export const zvaultRevokeKey = async ({
  domain,
  wallet,
  serverAddress,
  token,
  clientId,
  publicKey,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
  /** Wallet ID */
  clientId: string
  /** Public key */
  publicKey: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultRevokeKey(serverAddress, token, clientId, publicKey)
}

export const zvaultDeletePrimaryKey = async ({
  domain,
  wallet,
  serverAddress,
  token,
  clientId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
  /** Wallet ID */
  clientId: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultDeletePrimaryKey(serverAddress, token, clientId)
}

export const zvaultRetrieveWallets = async ({
  domain,
  wallet,
  serverAddress,
  token,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultRetrieveWallets(serverAddress, token) as string
}

export const zvaultRetrieveSharedWallets = async ({
  domain,
  wallet,
  serverAddress,
  token,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Server address */
  serverAddress: string
  /** JWT Token */
  token: string
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.zvaultRetrieveSharedWallets(serverAddress, token) as string
}
