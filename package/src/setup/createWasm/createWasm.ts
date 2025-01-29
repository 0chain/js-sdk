import { createProxy } from './createProxy'
import { Config, getBridge, globalCtx, SetIsWasmLoaded } from './bridge'
import { loadWasm } from './loadWasm'

/**
 * Creates a WebAssembly (Wasm) instance and returns a proxy object for accessing SDK methods.
 * @returns The proxy object for accessing SDK methods.
 */
export async function createWasm(
  config: Config,
  setIsWasmLoaded: SetIsWasmLoaded
) {
  // Initialize __zcn_wasm__
  const bridge = getBridge()
  bridge.__config__ = config

  if (bridge.__proxy__) {
    return bridge.__proxy__
  }

  const g = globalCtx()
  const go = new g.Go()

  loadWasm(go, setIsWasmLoaded)

  const proxy = createProxy(go)
  bridge.__proxy__ = proxy

  g.goWasm = proxy

  return proxy
}

// TODO
// export GoWasmProxy = ReturnType<typeof createWasm>
