import {
  createWasmLoader,
  type InitializeWasm,
  type WasmLoaderOptions,
} from './createWasmLoader'

let retries = 0

export const wasmLoader = ({
  onLog,
  debounceTimeout,
  setIsWasmLoaded,
}: {
  onLog?: WasmLoaderOptions['onLog']
  debounceTimeout?: WasmLoaderOptions['debounceTimeout']
  setIsWasmLoaded?: WasmLoaderOptions['setIsWasmLoaded']
}): InitializeWasm => {
  const getRetries = () => retries
  const incrementRetries = () => retries++
  const resetRetries = () => (retries = 0)

  const loadWasm = createWasmLoader({
    onLog,
    debounceTimeout,
    setIsWasmLoaded,
    getRetries,
    incrementRetries,
    resetRetries,
  })

  return loadWasm
}
