// TODO: skipped getPublicEncryptionKey, hideLogs, showLogs, isWalletID, createThumbnail
import { getZcnContracts } from '@/constants'
import {
  getBip39MnemonicSeedBuffer,
  getBlsKeys,
  getSha3HashFromHexString,
  isHash,
} from '@/sdk/utils/crypto'
import { getWasm } from '@/setup/wasm'
import type { ActiveWallet, NetworkDomain } from '@/types/wallet'

type WalletKeys = {
  walletId: string
  privateKey: string
  publicKey: string
  publicEncryptionKey: string
}

export async function createWalletKeys(customBip39Mnemonic?: string) {
  const { mnemonic, buffer } = await getBip39MnemonicSeedBuffer(
    customBip39Mnemonic
  )
  const { publicKey, privateKey } = await getBlsKeys(buffer)
  const walletId = getSha3HashFromHexString(publicKey)

  return { keys: { walletId, privateKey, publicKey }, mnemonic }
}

// TODO: check if we need goWasm.sdk.getPublicEncryptionKey or not
export const getPublicEncryptionKey = async ({
  keys,
  domain,
}: {
  keys: {
    walletId: string
    publicKey: string
    privateKey: string
  }
  domain: NetworkDomain
}) => {
  const goWasm = await getWasm({ domain, wallet: { id: keys.walletId, keys } })
  return (await goWasm.sdk.getPublicEncryptionKeyV2(keys?.publicKey)) as string
}

type TokenSymbol = 'zcn' | (string & {})
export const getUSDRate = async ({
  domain,
  symbol = 'zcn',
}: {
  domain: NetworkDomain
  symbol?: TokenSymbol
}) => {
  const goWasm = await getWasm({ domain })
  return (await goWasm.sdk.getUSDRate(symbol)) as number
}

// TODO: check why we are not using sdk.isWalletId instead
export const isWalletId = (walletId: string) => {
  if (!walletId) return false
  if (!isHash(walletId)) return false
  return true
}

export const getGosdkVersion = async (domain: NetworkDomain) => {
  const goWasm = await getWasm({ domain })
  return (await goWasm.sdk.getVersion()) as string
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
}) => {
  const goWasm = await getWasm({ domain, wallet })
  return (await goWasm.sdk.getLookupHash(allocationId, filePath)) as string
}

/** makeSCRestAPICall issues a request to the public API of one of the smart contracts */
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
}) => {
  const { storageSCAddress, minerSCAddress } = getZcnContracts(domain)
  const scAddress = scType === 'sharders' ? storageSCAddress : minerSCAddress

  const goWasm = await getWasm({ domain })
  const data = await goWasm.sdk.makeSCRestAPICall(
    scAddress,
    relativePath,
    JSON.stringify(params)
  )
}

export const getWasmType = () => {
  return window.__zcn_wasm__?.wasmType as string | undefined
}
