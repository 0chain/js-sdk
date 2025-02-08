import { useCallback, useRef } from 'react'
import { createWasmLoader, type WasmLoaderOptions } from './createWasmLoader'

export const useWasmLoader = ({
  onLog,
  debounceTimeout,
  setIsWasmLoaded,
}: {
  onLog?: WasmLoaderOptions['onLog']
  debounceTimeout?: WasmLoaderOptions['debounceTimeout']
  setIsWasmLoaded?: WasmLoaderOptions['setIsWasmLoaded']
}) => {
  const retriesRef = useRef(0)

  const getRetries = () => retriesRef.current
  const incrementRetries = () => retriesRef.current++
  const resetRetries = () => (retriesRef.current = 0)

  const loadWasm = useCallback(
    createWasmLoader({
      onLog,
      debounceTimeout,
      setIsWasmLoaded,
      getRetries,
      incrementRetries,
      resetRetries,
    }),
    [onLog, debounceTimeout, setIsWasmLoaded]
  )

  return loadWasm
}
