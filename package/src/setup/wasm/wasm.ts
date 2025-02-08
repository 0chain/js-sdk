import type {
  NetworkDomain,
  Domain,
  ActiveWallet,
  NetworkConfig,
} from '@/types/wallet'
import { awaitWasmLoad } from '../wasmLoader/createWasmLoader'
import { networkConfig } from '@/constants'
import { getBls } from '@/utils'

export const resetGoWasm = () => {
  window.__zcn_wasm__ = undefined
  window.newGoWasm = undefined
  window.createWasmPromise = undefined
}

type ZboxAppType = 'vult' | 'blimp' | 'chalk' | 'chimney' | 'bolt' | 'atlus'
const getWasm = async ({
  domain,
  wallet,
  zboxAppType,
  networkConfig,
}: {
  domain: NetworkDomain
  wallet?: ActiveWallet
  zboxAppType?: ZboxAppType
  networkConfig?: NetworkConfig
}) => {
  if (!window.newGoWasm) {
    if (!window.createWasmPromise) {
      window.createWasmPromise = createWasm(
        domain as Domain,
        zboxAppType,
        networkConfig
      )
    }

    window.newGoWasm = await window.createWasmPromise
  }

  if (wallet?.peer_public_key && wallet?.is_split && wallet?.zauth_host) {
    await window.newGoWasm.sdk.registerZauthServer(wallet?.zauth_host)
  }

  if (wallet) {
    if (wallet.keys) {
      const { privateKey, publicKey, walletMnemonic } = wallet.keys
      const mnemonic =
        wallet?.mnemonic !== '' && wallet?.mnemonic?.split(' ')?.length === 24
          ? wallet.mnemonic
          : walletMnemonic

      const bls = await getBls()

      if (!mnemonic && !wallet?.is_split) {
        return window.newGoWasm
      }

      await window.newGoWasm.setWallet(
        bls,
        wallet.id || wallet.temp_id,
        wallet.client_key || publicKey,
        wallet.peer_public_key,
        privateKey,
        publicKey,
        mnemonic,
        (Boolean(wallet?.is_split) && Boolean(wallet?.peer_public_key)) || false
      )
    } else {
      await window.newGoWasm.sdk.setWalletMode(
        (Boolean(wallet?.is_split) && Boolean(wallet?.peer_public_key)) || false
      )
    }
  }

  return window.newGoWasm
}

const createWasm = async (
  domain: Domain,
  zboxAppType?: ZboxAppType,
  customNetworkConfig?: NetworkConfig
) => {
  if (domain.startsWith('http'))
    throw new Error('domain should not start with http')

  const blockWorker = `https://${domain}/dns`
  const config = [
    customNetworkConfig?.chainId || networkConfig.chainId,
    customNetworkConfig?.blockWorker || blockWorker,
    customNetworkConfig?.signatureScheme || networkConfig.signatureScheme,
    customNetworkConfig?.minConfirmation || networkConfig.minConfirmation,
    customNetworkConfig?.minSubmit || networkConfig.minSubmit,
    customNetworkConfig?.confirmationChainLength ||
      networkConfig.confirmationChainLength,
    customNetworkConfig?.zboxHost || `https://0box.${domain}`,
    zboxAppType || '',
    customNetworkConfig?.sharderConsensus || 3,
  ]

  await awaitWasmLoad()

  await window.goWasm.sdk.init(...config)

  window.newGoWasm = window.goWasm
  return window.newGoWasm
}

export { getWasm }
