// TODO: skipped getUnprocessedWZCNBurnEvents, getProcessedZCNBurnTickets
import { errorOut } from '@/sdk/utils/misc'
import { getWasm } from '@/setup/wasm'
import type { ActiveWallet, NetworkDomain } from '@/types/wallet'

// TODO: Check if some variables can be moved to constants
/** initBridge initializes the bridge client */
export const initBridge = async ({
  domain,
  wallet,
  ethereumAddress,
  bridgeAddress,
  authorizersAddress,
  tokenAddress,
  ethereumNodeURL,
  gasLimit,
  value = 0,
  consensusThreshold,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Ethereum address of the wallet owner */
  ethereumAddress: string
  /** Address of the bridge contract on the Ethereum network */
  bridgeAddress: string
  /** Address of the authorizers contract on the Ethereum network */
  authorizersAddress: string
  /** Address of the token contract on the Ethereum network */
  tokenAddress: string
  /** URL of the Ethereum node */
  ethereumNodeURL: string
  /** Gas limit for the transactions */
  gasLimit: number
  /** Consensus threshold for the transactions */
  consensusThreshold: number
  /** Value to be sent with the transaction (unused) */
  value?: number
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.initBridge(
    ethereumAddress,
    bridgeAddress,
    authorizersAddress,
    tokenAddress,
    ethereumNodeURL,
    gasLimit,
    value,
    consensusThreshold
  )
}

/**
 * burnZCN burns ZCN tokens
 * @returns the hash of the transaction
 */
export const burnZCN = async ({
  domain,
  wallet,
  amount,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Amount of ZCN tokens to burn */
  amount: number
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.burnZCN(amount)
  return txnHash
}

/**
 * mintZCN Mints ZCN tokens
 * @returns the hash of the transaction
 */
export const mintZCN = async ({
  domain,
  wallet,
  burnTxnHash,
  timeout,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Hash of the burn transaction */
  burnTxnHash: string
  /**
   * Timeout in seconds
   * @deprecated
   */
  timeout: number
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.mintZCN(burnTxnHash, timeout)
  return txnHash
}

type MintPayload = {
  zcn_txn_id: string
  amount: number
  to: string
  nonce: number
  signatures: AuthorizerSignature[]
}
type AuthorizerSignature = {
  authorizer_id: string
  signature: Uint8Array
}

/** getMintWZCNPayload returns the *Mint WZCN Payload* for the given burn transaction hash */
export const getMintWZCNPayload = async ({
  domain,
  wallet,
  burnTxnHash,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Hash of the burn transaction */
  burnTxnHash: string
}): Promise<MintPayload> => {
  const goWasm = await getWasm({ domain, wallet })
  try {
    const mintPayloadJson = await goWasm.sdk.getMintWZCNPayload(burnTxnHash)
    const mintPayload = JSON.parse(mintPayloadJson)
    return mintPayload
  } catch (err) {
    throw errorOut('getMintWZCNPayload', err)
  }
}

type BurnEvent = {
  nonce: number
  amount: number
  hash: string
}
/** getUnprocessedWZCNBurnEvents returns all unprocessed WZCN burn events from the Ethereum network */
export const getUnprocessedWZCNBurnEvents = async ({
  domain,
  wallet,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
}): Promise<BurnEvent[]> => {
  const goWasm = await getWasm({ domain, wallet })
  try {
    const burnEventsJson = await goWasm.sdk.getNotProcessedWZCNBurnEvents()
    const burnEvents = JSON.parse(burnEventsJson)
    return burnEvents
  } catch (err) {
    throw errorOut('getNotProcessedWZCNBurnEvents', err)
  }
}

/** BurnTicket represents the burn ticket of native ZCN tokens used by the bridge protocol to mint ERC20 tokens */
type BurnTicket = {
  hash: string
  amount: number
  nonce: number
}
/** getProcessedZCNBurnTickets Returns all processed ZCN burn tickets burned for a certain ethereum address */
export const getProcessedZCNBurnTickets = async ({
  domain,
  wallet,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
}): Promise<BurnTicket[]> => {
  const goWasm = await getWasm({ domain, wallet })
  try {
    const burnTicketsJson = await goWasm.sdk.getProcessedZCNBurnTickets()
    const burnTickets = JSON.parse(burnTicketsJson)
    return burnTickets
  } catch (err) {
    throw errorOut('getProcessedZCNBurnTickets', err)
  }
}

/** estimateMintWZCNGasAmount performs gas amount estimation for the given Mint WZCN transaction. */
export const estimateMintWZCNGasAmount = async ({
  domain,
  wallet,
  from,
  to,
  zcnTransaction,
  amountTokens,
  nonce,
  signaturesRaw,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Address of the sender */
  from: string
  /** Address of the receiver */
  to: string
  /** Hash of the ZCN transaction */
  zcnTransaction: string
  /** Amount of tokens to mint */
  amountTokens: number
  /** Nonce of the transaction */
  nonce: number
  /** Encoded format (base-64) of the burn signatures received from the authorizers. */
  signaturesRaw: string[]
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })

  const amtToken = String(amountTokens)
  const gasAmount = await goWasm.sdk.estimateMintWZCNGasAmount(
    from,
    to,
    zcnTransaction,
    amtToken,
    nonce,
    signaturesRaw
  )
  return gasAmount
}

// TODO: web3-utils for address?
/** estimateBurnWZCNGasAmount performs gas amount estimation for the given burn wzcn transaction */
export const estimateBurnWZCNGasAmount = async ({
  domain,
  wallet,
  from,
  to,
  amountTokens,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Address of the sender */
  from: string
  /** Address of the receiver */
  to: string
  /** Amount of tokens to burn */
  amountTokens: number
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })

  const amtToken = String(amountTokens)
  const gasAmount = await goWasm.sdk.estimateBurnWZCNGasAmount(
    from,
    to,
    amtToken
  )
  return gasAmount
}

/** estimateGasPrice performs gas estimation for the given transaction using Alchemy enhanced API returning approximate final gas fee */
export const estimateGasPrice = async ({
  domain,
  wallet,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const gasPrice = await goWasm.sdk.estimateGasPrice()
  return gasPrice
}
