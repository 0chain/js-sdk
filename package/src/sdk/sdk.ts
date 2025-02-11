// TODO: skipped getPublicEncryptionKey, hideLogs, showLogs, isWalletID, createThumbnail
import { getZcnContracts } from '@/constants'
import {
  getBip39MnemonicSeedBuffer,
  getBlsKeys,
  getSha3HashFromHexString,
  isHash,
} from '@/sdk/utils/crypto'
import { truncateAddress } from '@/sdk/utils/misc'
import { getWasm } from '@/setup/wasm'
import type { WasmType } from '@/types'
import type { ActiveWallet, BasicWallet, NetworkDomain } from '@/types/wallet'

/** Creates wallet keys including wallet ID, public key, and private key using BLS (Boneh-Lynn-Shacham) cryptography. */
export const createWalletKeys = async (
  /** Optional 24 word [bip39](https://iancoleman.io/bip39/) mnemonic phrase. */
  customBip39Mnemonic?: string
): Promise<{
  keys: {
    walletId: string
    /** BLS public key */
    publicKey: string
    /** BLS private key */
    privateKey: string
  }
  mnemonic: string
}> => {
  const { mnemonic, buffer } = await getBip39MnemonicSeedBuffer(
    customBip39Mnemonic
  )
  const { publicKey, privateKey } = await getBlsKeys(buffer)
  const walletId = getSha3HashFromHexString(publicKey)
  return { keys: { walletId, privateKey, publicKey }, mnemonic }
}

// TODO: check if we need goWasm.sdk.getPublicEncryptionKey or not
/** Retrieves the public encryption key for a wallet. */
export const getPublicEncryptionKey = async ({
  keys,
  domain,
}: {
  keys: {
    walletId: string
    /** BLS public key */
    publicKey: string
    /** BLS private key */
    privateKey: string
  }
  domain: NetworkDomain
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet: { id: keys.walletId, keys } })
  return (await goWasm.sdk.getPublicEncryptionKeyV2(keys?.publicKey)) as string
}

/** Create a new wallet. Also, helps to recover a wallet using its mnemonic phrase. */
export const createWallet = async ({
  domain,
  walletName,
  customBip39Mnemonic,
}: {
  domain: NetworkDomain
  walletName?: string
  /**
   * Optional 24 word [bip39](https://iancoleman.io/bip39/) mnemonic phrase for wallet recovery.
   * If `customBip39Mnemonic` is not provided, a new mnemonic will be generated.
   */
  customBip39Mnemonic?: string
}): Promise<BasicWallet> => {
  const { keys, mnemonic } = await createWalletKeys(customBip39Mnemonic)
  const publicEncryptionKey = await getPublicEncryptionKey({ keys, domain })
  return {
    id: keys.walletId,
    name: walletName || truncateAddress(keys.walletId, 4),
    mnemonic,
    version: '1.0',
    creationDate: Date.now(),
    keys: { ...keys, publicEncryptionKey, walletMnemonic: mnemonic },
  }
}

// TODO: check why we are not using sdk.isWalletId instead
export const isWalletId = (walletId: string): boolean => {
  if (!walletId) return false
  if (!isHash(walletId)) return false
  return true
}

export const getGosdkVersion = async (): Promise<string> => {
  const goWasm = await getWasm({ domain: '' })
  return await goWasm.sdk.getVersion()
}

// TODO: be more specific for ActiveWallet type - kms or service etc - check redux how we set `wallet:`
export const getLookupHash = async ({
  domain,
  allocationId,
  filePath,
  wallet,
}: {
  domain: NetworkDomain
  allocationId: string
  filePath: string
  wallet: ActiveWallet
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  return await goWasm.sdk.getLookupHash(allocationId, filePath)
}

/** makeSCRestAPICall issues a request to the public API of one of the smart contracts
 * @returns Response in JSON string
 */
export const makeSCRestAPICall = async ({
  domain,
  scType = 'sharders',
  endpoint: relativePath,
  params,
}: {
  domain: NetworkDomain
  /** Smart contract type */
  scType: 'sharders' | 'miners'
  /** Relative path of the endpoint */
  endpoint: string
  /** Parameters in JSON format */
  params?: Record<string, string>
}): Promise<string> => {
  const { storageSCAddress, minerSCAddress } = getZcnContracts(domain)
  // TODO: add option for custom scAddress
  const scAddress = scType === 'sharders' ? storageSCAddress : minerSCAddress

  const goWasm = await getWasm({ domain })
  const data = await goWasm.sdk.makeSCRestAPICall(
    scAddress,
    relativePath,
    JSON.stringify(params)
  )

  return data
}

/** @returns Wasm type. If SDK is not initialized, `returns undefined` */
export const getWasmType = () => {
  return window.__zcn_wasm__?.wasmType as WasmType | undefined
}

/**
 * send tokens to a client ID / wallet ID
 *
 * @returns The transaction hash.
 */
export const send = async ({
  wallet,
  domain,
  toClientId,
  tokens,
  fee,
  desc,
}: {
  wallet: ActiveWallet
  domain: NetworkDomain
  /** Client ID / Wallet ID to send tokens to */
  toClientId: string
  /** Number of tokens to send */
  tokens: number
  /** Transaction fee */
  fee: number
  /** Description of the transaction */
  desc: string
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })

  const txnHash = await goWasm.sdk.send(toClientId, tokens, fee, desc)
  return txnHash
}
