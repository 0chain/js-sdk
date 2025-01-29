import { getJsProxy, JsProxyMethods } from './createProxy/jsProxy'
import { SdkProxyMethods } from './createProxy/sdkProxy'

export const globalCtx = () => {
  if (typeof window !== 'undefined') return window || globalThis || self
  else {
    console.error('Window object not available')
    return {} as Window
  }
}

/**
 * Initializes the `window.__zcn_wasm__` bridge object.
 * @returns Bridge object. This is an easier way to refer to the Go WASM object.
 */
export const getBridge = (): Bridge => {
  const g = globalCtx()

  const currBridge = g.__zcn_wasm__
  if (currBridge) return currBridge

  const newBridge: Bridge = {
    glob: { index: 0 },
    jsProxy: getJsProxy(),
    sdk: {},
  }
  g.__zcn_wasm__ = newBridge

  return newBridge
}

declare global {
  interface Window {
    __zcn_wasm__?: Bridge | undefined
    Go: new () => any
    /** Add `<script src="https://cdn.jsdelivr.net/gh/herumi/bls-wasm@v1.0.0/browser/bls.js"></script>` before accessing this */
    bls?: any
    newGoWasm?: any
    createWasmPromise?: Promise<any> | undefined
    [key: string]: any // Type for properties like `__zcn_upload_reader_<glob_idx>`,  `__zcn_upload_callback_<glob_idx>`, etc
  }
}

export type Bridge = {
  wasmType?: 'normal' | 'enterprise'
  __wasm_initialized__?: boolean
  __config__?: Config
  glob: {
    index: number
  }
  /** walletId is available after setWallet method succeeds */
  walletId?: string
  /** secretKey is available after setWallet method succeeds */
  secretKey?: any // TODO -- is it a string?
  /** peerPublicKey is available after setWallet method succeeds */
  peerPublicKey?: any
  jsProxy: {
    /** BLS object is available when setWallet method is called */
    bls?: any
    /** secretKey is available when setWallet method is called */
    secretKey?: any // TODO -- is it a string?
    /** secretKey is available when setWallet method is called */
    publicKey?: any
    /** publicKey is available when setWallet method is called */
    pubkeyStr?: string
    /** isSplit is set when setWallet method is called */
    isSplit?: boolean
  } & {
    [K in keyof JsProxyMethods]: JsProxyMethods[K]
  }
  /** proxy object for go to expose its methods */
  sdk: any
  /** `bridge.__proxy__` is avilable when createWasm method is called */
  __proxy__?: {
    /** `bridge.__proxy__.sdk`: Proxy object for accessing SDK methods. */
    sdk: { [key: string]: any }
    /** `bridge.__proxy__.jsProxy`: Proxy object that Exposes JS methods for go */
    jsProxy: {}
  } & {
    [K in keyof SdkProxyMethods]: SdkProxyMethods[K]
  }
}

export type Config = {
  /**
   * `wasmBaseUrl` is the base URL of your enterprise-zcn.wasm & zcn.wasm
   *
   * Example: if `wasmBaseUrl` is `https://example.com/wasm` then WASM files
   * should be located at:
   * - `https://example.com/wasm/enterprise-zcn.wasm` for Enterprise WASM
   * - `https://example.com/wasm/zcn.wasm` for Standard WASM
   */
  wasmBaseUrl?: string
  zus?: ZusConfig
} & (
  | { useCachedWasm?: false; cacheConfig?: never }
  | { useCachedWasm: true; cacheConfig: CacheConfig }
)

type CacheConfig = {
  enterpriseGosdkVersion: string
  enterpriseWasmUrl?: string
  standardGosdkVersion: string
  standardWasmUrl?: string
}

type ZusConfig = {
  cdnUrl?: string
}

export type SetIsWasmLoaded = (isLoaded: boolean) => void
export type GoInstance = InstanceType<Window['Go']>
