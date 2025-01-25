const g = typeof window !== 'undefined' ? window : global

function hexStringToByte(str) {
  if (!str) return new Uint8Array()

  const a = []
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16))
  }

  return new Uint8Array(a)
}

async function createObjectURL(buf, mimeType) {
  var blob = new Blob([buf], { type: mimeType })
  return URL.createObjectURL(blob)
}

/**
 * Sleep is used when awaiting for Go Wasm to initialize.
 * It uses the lowest possible sane delay time (via requestAnimationFrame).
 * However, if the window is not focused, requestAnimationFrame never returns.
 * A timeout will ensure to be called after 50 ms, regardless of whether or not
 * the tab is in focus.
 *
 * @returns {Promise} an always-resolving promise when a tick has been
 *     completed.
 */
export const sleep = (ms = 1000) => {
  return new Promise(resolve => {
    requestAnimationFrame(resolve)
    setTimeout(resolve, ms)
  })
}

/**
 * The maximum amount of time that we would expect Wasm to take to initialize.
 * If it doesn't initialize after this time, we send a warning to console.
 * Most likely something has gone wrong if it takes more than 10 seconds to
 * initialize.
 */
const maxTime = 10 * 1000

/**
 * bridge is an easier way to refer to the Go WASM object.
 */
let bridge = g.__zcn_wasm__

// Initialize __zcn_wasm__
const initZcnWasmObject = async () => {
  g.__zcn_wasm__ = g.__zcn_wasm__ || {
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
    sdk: {}, //proxy object for go to expose its methods
  }

  bridge = g.__zcn_wasm__
}
initZcnWasmObject()

const readChunk = (offset, chunkSize, file) =>
  new Promise((res, rej) => {
    const fileReader = new FileReader()
    const blob = file.slice(offset, chunkSize + offset)
    fileReader.onload = e => {
      const t = e.target
      if (t.error == null) {
        res({
          size: t.result.byteLength,
          buffer: new Uint8Array(t.result),
        })
      } else {
        rej(t.error)
      }
    }

    fileReader.readAsArrayBuffer(blob)
  })

async function md5Hash(file) {
  const result = new Promise((resolve, reject) => {
    const worker = new Worker('md5worker.js')
    worker.postMessage(file)
    worker.onmessage = e => {
      resolve(e.data)
      worker.terminate()
    }
    worker.onerror = reject
  })

  return result
}

// bulk upload files with FileReader
// objects: the list of upload object
//  - allocationId: string
//  - remotePath: string
//  - file: File
//  - thumbnailBytes: []byte
//  - encrypt: bool
//  - isUpdate: bool
//  - isRepair: bool
//  - numBlocks: int
//  - callback: function(totalBytes,completedBytes,error)
async function bulkUpload(options) {
  const start = bridge.glob.index
  const opts = options.map(obj => {
    const i = bridge.glob.index
    bridge.glob.index++
    const readChunkFuncName = '__zcn_upload_reader_' + i.toString()
    const callbackFuncName = '__zcn_upload_callback_' + i.toString()
    let md5HashFuncName = ''

    g[readChunkFuncName] = async (offset, chunkSize) => {
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
      g[callbackFuncName] = async (totalBytes, completedBytes, error) =>
        obj.callback(totalBytes, completedBytes, error)
    }

    return {
      allocationId: obj.allocationId,
      remotePath: obj.remotePath,
      readChunkFuncName: readChunkFuncName,
      fileSize: obj.file.size,
      thumbnailBytes: Array.from(obj?.thumbnailBytes || []).toString(),
      encrypt: obj.encrypt,
      webstreaming: obj.webstreaming,
      isUpdate: obj.isUpdate,
      isRepair: obj.isRepair,
      numBlocks: obj.numBlocks,
      callbackFuncName: callbackFuncName,
      md5HashFuncName: md5HashFuncName,
    }
  })

  const end = bridge.glob.index

  const result = await bridge.__proxy__.sdk.bulkUpload(JSON.stringify(opts))
  for (let i = start; i < end; i++) {
    g['__zcn_upload_reader_' + i.toString()] = null
    g['__zcn_upload_callback_' + i.toString()] = null
  }
  return result
}

async function blsSign(hash, secretKey) {
  if (!bridge.jsProxy) {
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

  return sig.serializeToHexStr()
}

async function blsVerifyWith(pk, signature, hash) {
  const publicKey = bridge.jsProxy.bls.deserializeHexStrToPublicKey(pk)
  const bytes = hexStringToByte(hash)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  return publicKey.verify(sig, bytes)
}

async function blsVerify(signature, hash) {
  if (!bridge.jsProxy && !bridge.jsProxy.publicKey) {
    const errMsg = 'err: bls.publicKey is not initialized'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  const bytes = hexStringToByte(hash)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  return bridge.jsProxy.publicKey.verify(sig, bytes)
}

async function blsAddSignature(secretKey, signature, hash) {
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

  return sig.serializeToHexStr()
}

async function setWallet(
  bls,
  clientID,
  clientKey,
  peerPublicKey,
  sk,
  pk,
  mnemonic,
  isSplit
) {
  if (!bls) throw new Error('bls is undefined, on wasm setWallet fn')
  if (!sk) throw new Error('secret key is undefined, on wasm setWallet fn')
  if (!pk) throw new Error('public key is undefined, on wasm setWallet fn')
  if (isSplit && !clientKey)
    throw new Error('clientKey is undefined, on wasm setWallet fn')

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

    // use proxy.sdk to detect if sdk is ready
    await bridge.__proxy__.sdk.setWallet(
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
  return bridge.walletId
}

function getPrivateKey() {
  return bridge.secretKey
}

function getPeerPublicKey() {
  return bridge.peerPublicKey
}

const getVersionedWasmDetails = () => {
  const c = getConfig()
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
  const defaultVersionedUrl = `${c.cdnUrl}/wasm/zcn-${wasmVersion}-${wasmType}.wasm`
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

const getCachedWasmResponse = async ({ wasmCache, wasmPath }) => {
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

const fetchWasm = async ({ wasmUrl, wasmPath, defaultUrl }) => {
  const caches = 'caches' in window ? window.caches : null

  // Check if the WASM file is cached
  const wasmCache = await caches?.open('wasm-cache')
  let response = await getCachedWasmResponse({ wasmCache, wasmPath })

  let shouldCache = false
  if (!response?.ok) {
    // WASM not found in cache, fetching from CDN
    response = await fetch(wasmUrl, {
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'application/wasm',
      },
    }).catch(err => {
      console.error('Failed to fetch from CDN, trying CDN fallback:', err)
    })
    if (response?.ok) shouldCache = true

    if (!response?.ok && wasmUrl !== defaultUrl) {
      response = await fetch(defaultUrl, {
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'application/wasm',
        },
      }).catch(err => {
        console.error('Failed to fetch from CDN fallback, trying local:', err)
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
      const storedWasmVersion = getIsEnterpriseMode()
        ? c.cacheConfig.enterpriseGosdkVersion
        : c.cacheConfig.standardGosdkVersion
      localStorage.setItem(wasmPath, storedWasmVersion)
    }
  } else {
    console.log('Using cached WASM.')
  }

  return { source: response, isVersioned: shouldCache }
}

async function loadWasm(go, setIsWasmLoaded) {
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
    if (g.__zcn_wasm__?.__wasm_initialized__ !== true) {
      console.warn(
        'wasm window.__zcn_wasm__ (zcn.__wasm_initialized__) still not true after max time'
      )
    }
  }, maxTime)

  go.run(result.instance)

  let hasInitialized = false

  while (!hasInitialized) {
    await sleep(300)

    if (g.__zcn_wasm__?.__wasm_initialized__ === true) {
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
  const isHost = host => currentLocation?.includes(host)

  if (isHost('localhost') || isHost('mob')) suffix = 'mob'
  else if (isHost('dev') || isHost('mob.desktop')) suffix = 'dev'
  else if (isHost('demo')) suffix = 'demo'
  else if (isHost('staging')) suffix = 'staging'
  else if (isHost('test')) suffix = 'test'

  const defaultUrl = `${c.cdnUrl}/${suffix}/${wasmType}`
  return { defaultUrl, suffix }
}

const getWasmPath = () => {
  return getIsEnterpriseMode() ? '/enterprise-zcn.wasm' : '/zcn.wasm'
}

/** @type {import("./createWasm").Config} */
const DEFAULT_CONFIG = {
  wasmBaseUrl: '',
  useCachedWasm: false,
}

/** @returns {import("./createWasm").Config} */
const getConfig = () => g.__zcn_wasm__.__config__ || DEFAULT_CONFIG

/**
 * Loads and initializes WASM
 * @param {import("./createWasm").Config} config
 * @param {import("./createWasm").setIsWasmLoaded} setIsWasmLoaded
 * @returns {Proxy} WASM proxy
 */
export async function createWasm(config = {}, setIsWasmLoaded) {
  initZcnWasmObject()
  g.__zcn_wasm__.__config__ = { ...DEFAULT_CONFIG, ...config }

  if (bridge.__proxy__) {
    return bridge.__proxy__
  }

  const go = new g.Go()

  loadWasm(go, setIsWasmLoaded)

  const sdkGet =
    (_, key) =>
    (...args) =>
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
      })

  const sdkProxy = new Proxy({}, { get: sdkGet })

  const jsProxy = new Proxy(
    {},
    {
      get: (_, key) => bridge.jsProxy[key],
      set: (_, key, value) => {
        bridge.jsProxy[key] = value
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
