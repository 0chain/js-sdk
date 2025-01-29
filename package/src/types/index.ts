const LOG_CODES = [
  'WASM_LOADING', // Info
  'WASM_LOADED', // Info
  'OUTDATED_WASM_VERSION', // Warn
  'WASM_TYPE_MISMATCH_RETRY', // Warn
  'INVALID_WASM_CONFIG', // Fatal
  'WASM_TYPE_MISMATCH', // Fatal
] as const

type LogData = {
  message: string
  data?: any
  code: (typeof LOG_CODES)[number]
}

export type OnLog = (
  type: 'info' | 'error' | 'warn' | 'debug',
  logData: LogData
) => void

type Domains = 'mainnet.zus.network' | 'example.com'
export type Domain = Domains | (string & {})

export type Wallet = {
  id?: string
  temp_id?: string
  name: string
  mnemonic: string
  source_client_id: string
  client_key?: string
  public_key: string
  keys: {
    privateKey: string
    publicKey?: string
    walletMnemonic: string
  }
  is_split?: boolean
  peer_public_key?: string
  zauth_host?: `https://zauth.${Domains}`
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

export const globalCtx = () => {
  if (typeof window !== 'undefined') return window || globalThis || self
  else {
    console.error('Window object not available')
    return {} as Window
  }
}

export type Bridge = {
  wasmType?: 'normal' | 'enterprise'
  __wasm_initialized__?: boolean
  glob: {
    index: number
  }
  /** walletId is avilable when setWallet method is called */
  walletId?: string
  jsProxy: {
    /** BLS object is available when setWallet method is called */
    bls?: any
    /** secretKey is available when setWallet method is called */
    secretKey?: any
    /** secretKey is available when setWallet method is called */
    publicKey?: any
  } & {
    // [K in keyof JsProxyMethods]: JsProxyMethods[K] // TODO
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
    // [K in keyof SdkProxyMethods]: SdkProxyMethods[K] // TODO
  }
}

export type AccountEntity = {
  id: string
  public_key: string
  secretKey: string
  timeStamp: number
}

export type ReqHeaders = Record<string, string | number>

export type TxnData = {
  hash: string
  version: number
  client_id: string
  to_client_id: string | null
  chain_id: number
  transaction_data: string
  transaction_value: number
  signature: string
  creation_date: number
  transaction_type: number
  transaction_output: string
  txn_output_hash: string | null
}

export type UploadObject = {
  allocationId: string
  remotePath: string
  file: File
  thumbnailBytes: Uint8Array
  encrypt: boolean
  isUpdate: boolean
  isRepair: boolean
  numBlocks: number
  callback: (totalBytes: number, completedBytes: number, error: any) => void
}
