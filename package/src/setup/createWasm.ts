import { Bridge, Config, SetIsWasmLoaded, UploadObject } from '../types'
import {
  createObjectURL,
  globalCtx,
  hexStringToByte,
  md5Hash,
  sleep,
} from './utils'

const g = typeof window !== 'undefined' ? window : global

/** BRIDGE SETUP START */

/**
 * The maximum amount of time that we would expect Wasm to take to initialize.
 * If it doesn't initialize after this time, we send a warning to console.
 * Most likely something has gone wrong if it takes more than 10 seconds to
 * initialize.
 */
const maxTime = 10000 // 10 seconds // TODO

/**
 * Initializes the `window.__zcn_wasm__` bridge object.
 * @returns Bridge object. This is an easier way to refer to the Go WASM object.
 */
const getBridge = (): Bridge => {
  const g = globalCtx()

  const currBridge = g.__zcn_wasm__
  if (currBridge) return currBridge

  const newBridge: Bridge = {
    glob: { index: 0 },
    jsProxy: {
      secretKey: null,
      publicKey: null,
      sign: blsSign,
      verify: blsVerify,
      verifyWith: blsVerifyWith,
      addSignature: blsAddSignature,
      createObjectURL,
      sleep,
    },
    sdk: {},
  }
  g.__zcn_wasm__ = newBridge

  return newBridge
}

// Initialize __zcn_wasm__
getBridge()

/** BRIDGE SETUP END */

const getProxy = (bridge: Bridge) => {
  const proxy = bridge.__proxy__
  if (!proxy) {
    throw new Error(
      'The Bridge proxy (__proxy__) is not initialized. Make sure to call createWasm first.'
    )
  }
  return proxy
}

const readChunk = (offset: number, chunkSize: number, file: File) =>
  new Promise<{ size: number; buffer: Uint8Array }>((res, rej) => {
    const fileReader = new FileReader()
    const blob = file.slice(offset, chunkSize + offset)
    fileReader.onload = e => {
      const t = e.target
      if (t === null) {
        rej('err: fileReader onload target is null')
        return
      }
      if (t.error == null) {
        const result = t.result as ArrayBuffer
        res({
          size: result.byteLength,
          buffer: new Uint8Array(result),
        })
      } else {
        rej(t.error)
      }
    }

    fileReader.readAsArrayBuffer(blob)
  })

/**
 * Performs a bulk upload of multiple files.
 *
 * @param options An array of upload options for each file.
 * @returns // TODO - return type
 */
async function bulkUpload(options: UploadObject[]) {
  const g = globalCtx()
  const bridge = getBridge()

  const start = bridge.glob.index
  const opts = options.map(obj => {
    const i = bridge.glob.index
    bridge.glob.index++
    const readChunkFuncName = '__zcn_upload_reader_' + i.toString()
    const callbackFuncName = '__zcn_upload_callback_' + i.toString()
    let md5HashFuncName = ''

    g[readChunkFuncName] = async (offset: number, chunkSize: number) => {
      console.log(
        'bulk_upload: read chunk remotePath:' +
          obj.remotePath +
          ' offset:' +
          offset +
          ' chunkSize:' +
          chunkSize
      )
      const chunk = await readChunk(offset, chunkSize, obj.file)
      return chunk.buffer
    }

    if (obj.file.size > 25 * 1024 * 1024) {
      md5HashFuncName = '__zcn_md5_hash_' + i.toString()
      const md5Res = md5Hash(obj.file)
      g[md5HashFuncName] = async () => {
        const hash = await md5Res
        return hash
      }
    }

    if (obj.callback) {
      g[callbackFuncName] = async (
        totalBytes: number,
        completedBytes: number,
        error: any
      ) => obj.callback(totalBytes, completedBytes, error)
    }

    return {
      allocationId: obj.allocationId,
      remotePath: obj.remotePath,
      fileSize: obj.file.size,
      encrypt: obj.encrypt,
      isUpdate: obj.isUpdate,
      isRepair: obj.isRepair,
      numBlocks: obj.numBlocks,
      webstreaming: obj.webstreaming,
      thumbnailBytes: Array.from(obj?.thumbnailBytes || []).toString(),
      readChunkFuncName: readChunkFuncName,
      callbackFuncName: callbackFuncName,
      md5HashFuncName: md5HashFuncName,
    }
  })

  const end = bridge.glob.index

  const proxy = getProxy(bridge)
  const result = await proxy.sdk.bulkUpload(JSON.stringify(opts))
  for (let i = start; i < end; i++) {
    g['__zcn_upload_reader_' + i.toString()] = null
    g['__zcn_upload_callback_' + i.toString()] = null
  }
  return result
}

/**
 * Signs a hash using BLS signature scheme.
 *
 * @param hash The hash to be signed.
 * @returns The serialized signature in hexadecimal format.
 */
async function blsSign(hash: string, secretKey: string) {
  const bridge = getBridge()
  if (!bridge.jsProxy || !bridge.jsProxy.secretKey) {
    const errMsg = 'err: bls.secretKey is not initialized'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  const bytes = hexStringToByte(hash)

  const privateKey = bridge.jsProxy.bls.deserializeHexStrToSecretKey(secretKey)
  const sig = privateKey.sign(bytes)

  if (!sig) {
    const errMsg = 'err: wasm blsSign function failed to sign transaction'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  return sig.serializeToHexStr() as string
}

/**
 * Verifies a BLS signature against a given hash and public key.
 *
 * @param pk The public key.
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 * @returns A boolean indicating whether the signature is valid or not.
 */
async function blsVerifyWith(pk: string, signature: string, hash: string) {
  const bridge = getBridge()

  const publicKey = bridge.jsProxy.bls.deserializeHexStrToPublicKey(pk)
  const bytes = hexStringToByte(hash)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  return publicKey.verify(sig, bytes)
}

/**
 * Verifies a BLS signature against a given hash.
 *
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 * @returns A boolean indicating whether the signature is valid or not.
 */
async function blsVerify(signature: string, hash: string) {
  const bridge = getBridge()

  if (!bridge.jsProxy || !bridge.jsProxy.publicKey) {
    const errMsg = 'err: bls.publicKey is not initialized'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  const bytes = hexStringToByte(hash)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  return bridge.jsProxy.publicKey.verify(sig, bytes)
}

/**
 * Adds a signature to an existing signature.
 *
 * @param secretKey The secret key.
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 *
 * @returns The serialized signature in hexadecimal format.
 */
async function blsAddSignature(
  secretKey: string,
  signature: string,
  hash: string
) {
  const bridge = getBridge()
  if (!bridge.jsProxy) {
    const errMsg = 'err: bls.secretKey is not initialized'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  const privateKey = bridge.jsProxy.bls.deserializeHexStrToSecretKey(secretKey)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  var sig2 = privateKey.sign(hexStringToByte(hash))
  if (!sig2) {
    const errMsg =
      'err: wasm blsAddSignature function failed to sign transaction'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  sig.add(sig2)

  return sig.serializeToHexStr() as string
}

/**
 * Sets the wallet information in the bridge and the Go instance.
 *
 * @param bls The BLS object from bls-wasm script.
 * @param clientID The client ID.
 * @param clientKey The client key.
 * @param peerPublicKey The peer public key.
 * @param sk The serialized secret key.
 * @param pk The serialized public key.
 * @param mnemonic The mnemonic.
 * @param isSplit Whether the wallet has split keys enabled or not.
 */
async function setWallet(
  bls: any, // TODO: check bls
  clientID: string,
  clientKey: string,
  peerPublicKey: string,
  sk: string,
  pk: string,
  mnemonic: string,
  isSplit: boolean
) {
  if (!bls) throw new Error('bls is undefined')
  if (!sk) throw new Error('secret key is undefined')
  if (!pk) throw new Error('public key is undefined')
  if (isSplit && !clientKey) throw new Error('clientKey is undefined')

  const bridge = getBridge()

  if (
    bridge.walletId != clientID ||
    bridge.jsProxy.pubkeyStr != pk ||
    bridge.jsProxy.isSplit != isSplit
  ) {
    bridge.jsProxy.bls = bls
    bridge.jsProxy.secretKey = bls.deserializeHexStrToSecretKey(sk)
    bridge.jsProxy.publicKey = bls.deserializeHexStrToPublicKey(pk)
    bridge.jsProxy.pubkeyStr = pk
    bridge.jsProxy.isSplit = isSplit

    const proxy = getProxy(bridge)

    if (!proxy?.sdk?.setWallet)
      throw new Error('proxy.sdk.setWallet is not defined')
    await proxy.sdk.setWallet(
      clientID,
      clientKey,
      peerPublicKey,
      pk,
      sk,
      mnemonic,
      isSplit
    )
    bridge.walletId = clientID
    bridge.secretKey = sk
    bridge.peerPublicKey = peerPublicKey
  }
}

function getWalletId() {
  const bridge = getBridge()
  return bridge.walletId
}

function getPrivateKey() {
  const bridge = getBridge()
  return bridge.secretKey
}

function getPeerPublicKey() {
  const bridge = getBridge()
  return bridge.peerPublicKey
}

const getVersionedWasmDetails = () => {
  const c = getConfig()
  if (!c.useCachedWasm) return { url: null, version: null, type: null }

  const isEnterpriseMode = getIsEnterpriseMode()
  const wasmVersion = isEnterpriseMode
    ? c.cacheConfig.enterpriseGosdkVersion
    : c.cacheConfig.standardGosdkVersion
  const wasmType = isEnterpriseMode ? 'enterprise' : 'normal'

  const customUrl = isEnterpriseMode
    ? c.cacheConfig.enterpriseWasmUrl
    : c.cacheConfig.standardWasmUrl
  if (customUrl) return { url: customUrl, version: wasmVersion, type: wasmType }

  // For Zus prod apps only
  if (!c.zus?.cdnUrl) return { url: null, version: null, type: null }
  const defaultVersionedUrl = `${c.zus.cdnUrl}/wasm/zcn-${wasmVersion}-${wasmType}.wasm`
  return { url: defaultVersionedUrl, version: wasmVersion, type: wasmType }
}

const getIsEnterpriseMode = () =>
  localStorage.getItem('enterpriseAlloc') === 'enabled'

const getWasmUrl = () => {
  const wasmPath = getWasmPath()
  const { defaultUrl, suffix } = getDefaultUrl()
  if (getConfig().useCachedWasm) {
    const wasm = getVersionedWasmDetails()
    const wasmUrl = !wasm.version ? defaultUrl : wasm.url
    return { suffix, wasmUrl, wasmPath, defaultUrl }
  } else {
    return { suffix, wasmUrl: defaultUrl, wasmPath, defaultUrl }
  }
}

const getCachedWasmResponse = async ({
  wasmCache,
  wasmPath,
}: {
  wasmCache: Cache | undefined
  wasmPath: string
}) => {
  if (!wasmCache || !wasmPath) return null

  const c = getConfig()
  if (!c.useCachedWasm) return null

  const expectedWasmVersion = getIsEnterpriseMode()
    ? c.cacheConfig.enterpriseGosdkVersion
    : c.cacheConfig.standardGosdkVersion

  const cachedWasmVersion = localStorage.getItem(wasmPath)
  const shouldUseCachedWasm = cachedWasmVersion === expectedWasmVersion
  if (!shouldUseCachedWasm) return null
  return wasmCache.match(wasmPath)
}

const fetchWasm = async ({
  wasmUrl,
  wasmPath,
  defaultUrl,
}: {
  wasmUrl: string | null
  wasmPath: string
  defaultUrl: string | null
}) => {
  const caches = 'caches' in window ? window.caches : null

  // Check if the WASM file is cached
  const wasmCache = await caches?.open('wasm-cache')
  let response = await getCachedWasmResponse({ wasmCache, wasmPath })

  let shouldCache = false
  if (!response?.ok) {
    // WASM not found in cache, fetching from CDN
    if (wasmUrl) {
      response = await fetch(wasmUrl, {
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'application/wasm',
        },
      }).catch(err => {
        console.error('Failed to fetch from CDN, trying CDN fallback:', err)
        return null
      })
      if (response?.ok) shouldCache = true
    }

    if (!response?.ok && wasmUrl !== defaultUrl && defaultUrl) {
      response = await fetch(defaultUrl, {
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'application/wasm',
        },
      }).catch(err => {
        console.error('Failed to fetch from CDN fallback, trying local:', err)
        return null
      })
    }

    // If CDN network request fails, fallback to the local WASM path
    if (!response?.ok) {
      wasmUrl = wasmPath
      response = await fetch(wasmUrl)
    }

    if (!response?.ok) throw new Error(`Failed to fetch WASM`)

    if (shouldCache) {
      // Cache the fetched WASM response
      await wasmCache?.put(wasmPath, response.clone())

      const c = getConfig()
      if (c.useCachedWasm) {
        const storedWasmVersion = getIsEnterpriseMode()
          ? c.cacheConfig.enterpriseGosdkVersion
          : c.cacheConfig.standardGosdkVersion
        localStorage.setItem(wasmPath, storedWasmVersion)
      }
    }
  } else {
    console.log('Using cached WASM.')
  }

  return { source: response, isVersioned: shouldCache }
}

/**
 * Loads the WebAssembly (Wasm) module and runs it within the Go instance.
 *
 * @param go The Go instance.
 */
async function loadWasm(
  go: InstanceType<Window['Go']>,
  setIsWasmLoaded: (newState: boolean) => void
) {
  // If instantiateStreaming doesn't exists, polyfill/create it on top of instantiate
  if (!WebAssembly?.instantiateStreaming) {
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer()
      return await WebAssembly.instantiate(source, importObject)
    }
  }

  const { suffix, wasmUrl, wasmPath, defaultUrl } = getWasmUrl()
  const { source } = await fetchWasm({ wasmUrl, wasmPath, defaultUrl })

  // set SUFFIX env variable in gosdk
  go.env = { SUFFIX: suffix }

  // initiate wasm
  const result = await WebAssembly.instantiateStreaming(source, go.importObject)

  setTimeout(() => {
    const bridge = getBridge()
    if (bridge?.__wasm_initialized__ !== true) {
      console.warn(
        'wasm window.__zcn_wasm__ (zcn.__wasm_initialized__) still not true after max time'
      )
    }
  }, maxTime)

  go.run(result.instance)

  let hasInitialized = false

  while (!hasInitialized) {
    await sleep(300)

    const bridge = getBridge()
    if (bridge?.__wasm_initialized__ === true) {
      hasInitialized = true
      setIsWasmLoaded(true)
    }
  }
}

const getDefaultUrl = () => {
  const c = getConfig()
  let suffix = 'mainnet'
  const isEnterpriseMode = getIsEnterpriseMode()
  const wasmType = isEnterpriseMode ? 'enterprise-zcn.wasm' : 'zcn.wasm'

  if (c.wasmBaseUrl) {
    const fallbackUrl = `${c.wasmBaseUrl}/${wasmType}`
    return { defaultUrl: fallbackUrl, suffix }
  }

  // For Zus prod apps only
  const currentLocation = window?.location?.hostname
  const isHost = (host: string) => currentLocation?.includes(host)

  if (isHost('localhost') || isHost('mob')) suffix = 'mob'
  else if (isHost('dev') || isHost('mob.desktop')) suffix = 'dev'
  else if (isHost('demo')) suffix = 'demo'
  else if (isHost('staging')) suffix = 'staging'
  else if (isHost('test')) suffix = 'test'

  if (!c.zus?.cdnUrl) return { defaultUrl: null, suffix }
  const defaultUrl = `${c.zus.cdnUrl}/${suffix}/${wasmType}`
  return { defaultUrl, suffix }
}

const getWasmPath = () => {
  return getIsEnterpriseMode() ? '/enterprise-zcn.wasm' : '/zcn.wasm'
}

/** @type {import("./createWasm").Config} */
const DEFAULT_CONFIG: Config = {
  wasmBaseUrl: '',
  useCachedWasm: false,
}

const getConfig = () => getBridge().__config__ || DEFAULT_CONFIG

/**
 * Creates a WebAssembly (Wasm) instance and returns a proxy object for accessing SDK methods.
 * @returns The proxy object for accessing SDK methods.
 */
export async function createWasm(
  config: Config,
  setIsWasmLoaded: SetIsWasmLoaded
) {
  const bridge = getBridge()
  bridge.__config__ = config

  if (bridge.__proxy__) {
    return bridge.__proxy__
  }

  const g = globalCtx()
  const go = new g.Go()

  loadWasm(go, setIsWasmLoaded)

  const sdkProxy = new Proxy(
    {},
    {
      get:
        (_, key) =>
        (...args: any[]) =>
          // eslint-disable-next-line
          new Promise(async (resolve, reject) => {
            if (!go || go.exited) {
              return reject(new Error('The Go instance is not active.'))
            }

            while (bridge.__wasm_initialized__ !== true) {
              await sleep(1000)
            }

            if (typeof bridge.sdk[key] !== 'function') {
              resolve(bridge.sdk[key])

              if (args.length !== 0) {
                reject(
                  new Error(
                    'Retrieved value from WASM returned function type, however called with arguments.'
                  )
                )
              }
              return
            }

            try {
              let resp = bridge.sdk[key].apply(undefined, args)

              // support wasm.BindAsyncFunc
              if (resp && typeof resp.then === 'function') {
                resp = await Promise.race([resp])
              }

              if (resp && resp.error) {
                reject(resp.error)
              } else {
                resolve(resp)
              }
            } catch (e) {
              reject(e)
            }
          }),
    }
  )

  const jsProxy = new Proxy(
    {},
    {
      get: <T extends keyof Bridge['jsProxy']>(_: {}, key: T) => {
        const bridge = getBridge()
        return bridge.jsProxy[key]
      },
      set: <T extends keyof Bridge['jsProxy']>(
        _: {},
        key: T,
        value: Bridge['jsProxy'][T]
      ) => {
        const bridge = getBridge()

        bridge.jsProxy[key] = value
        return true
      },
    }
  )

  const proxy = {
    bulkUpload,
    setWallet,
    getWalletId,
    getPrivateKey,
    getPeerPublicKey,
    sdk: sdkProxy, //expose sdk methods for js
    jsProxy, //expose js methods for go
  }

  bridge.__proxy__ = proxy

  g.goWasm = proxy

  return proxy
}

export type JsProxyMethods = {
  sign: typeof blsSign
  verify: typeof blsVerify
  verifyWith: typeof blsVerifyWith
  addSignature: typeof blsAddSignature
  createObjectURL: typeof createObjectURL
  sleep: typeof sleep
}

export type SdkProxyMethods = {
  bulkUpload: typeof bulkUpload
  setWallet: typeof setWallet
}
