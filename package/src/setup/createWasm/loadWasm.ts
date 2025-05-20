import { sleep } from '@/utils'
import {
  getBridge,
  type Config,
  type GoInstance,
  type SetIsWasmLoaded,
} from './bridge'

const DEFAULT_CONFIG: Config = {
  wasmBaseUrl: '',
  useCachedWasm: false,
  isWasmGzipped: true,
}

export const getConfig = (): Config => getBridge().__config__ || DEFAULT_CONFIG

const getWasmPath = () => {
  return getIsEnterpriseMode() ? '/enterprise-zcn.wasm' : '/zcn.wasm'
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
    let headers: Record<string, string> = { 'Content-Type': 'application/wasm' }
    const cfg = getConfig()
    if (cfg.isWasmGzipped) headers['Content-Encoding'] = 'gzip'

    // WASM not found in cache, fetching from CDN
    if (wasmUrl) {
      response = await fetch(wasmUrl, { headers }).catch(err => {
        console.error('Failed to fetch from CDN, trying CDN fallback:', err)
        return null
      })
      if (response?.ok) shouldCache = true
    }

    if (!response?.ok && wasmUrl !== defaultUrl && defaultUrl) {
      response = await fetch(defaultUrl, { headers }).catch(err => {
        console.error('Failed to fetch from CDN fallback, trying local:', err)
        return null
      })
    }

    // If CDN network request fails, fallback to the local WASM path
    if (!response?.ok) {
      wasmUrl = wasmPath
      response = await fetch(wasmUrl, { headers })
    }

    if (!response?.ok) throw new Error(`Failed to fetch WASM`)

    if (shouldCache) {
      // Cache the fetched WASM response
      await wasmCache?.put(wasmPath, response.clone())

      if (cfg.useCachedWasm) {
        const storedWasmVersion = getIsEnterpriseMode()
          ? cfg.cacheConfig.enterpriseGosdkVersion
          : cfg.cacheConfig.standardGosdkVersion
        localStorage.setItem(wasmPath, storedWasmVersion)
      }
    }
  } else {
    console.log('Using cached WASM.')
  }

  return { source: response, isVersioned: shouldCache }
}

/**
 * The maximum amount of time that we would expect Wasm to take to initialize.
 * If it doesn't initialize after this time, we send a warning to console.
 * Most likely something has gone wrong if it takes more than 10 seconds to
 * initialize.
 */
const MAX_LOAD_TIMOUT = 10000 // 10 seconds

/**
 * Loads the WebAssembly (Wasm) module and runs it within the Go instance.
 *
 * @param go The Go instance.
 */
export async function loadWasm(
  go: GoInstance,
  setIsWasmLoaded: SetIsWasmLoaded
): Promise<void> {
  // If instantiateStreaming doesn't exists, polyfill/create it on top of instantiate
  if (!WebAssembly?.instantiateStreaming) {
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer()
      return await WebAssembly.instantiate(source, importObject)
    }
  }

  const { suffix, wasmUrl, wasmPath, defaultUrl } = getWasmUrl()
  const { source } = await fetchWasm({ wasmUrl, wasmPath, defaultUrl })

  // set SUFFIX env variable in GoSDK
  go.env = { SUFFIX: suffix }

  // Initiate WASM
  const result = await WebAssembly.instantiateStreaming(source, go.importObject)

  setTimeout(() => {
    const bridge = getBridge()
    if (bridge?.__wasm_initialized__ !== true) {
      console.warn(
        'wasm window.__zcn_wasm__ (zcn.__wasm_initialized__) still not true after max time'
      )
    }
  }, MAX_LOAD_TIMOUT)

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
