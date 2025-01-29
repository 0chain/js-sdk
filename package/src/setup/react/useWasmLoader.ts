import { useCallback, useRef } from 'react'
import { Config, createWasm } from '../createWasm'
import debounce from 'lodash.debounce'
import { OnLog } from '../../types'
import {
  checkIfWasmLoaded,
  awaitWasmLoad,
  getDesiredMode,
  isDesiredWasmInitiated,
} from '../wasmLoader'

const DEBOUNCE_TIMEOUT = 500
const MAX_RETRIES = 3
export const useWasmLoader = ({
  onLog,
  debounceTimeout = DEBOUNCE_TIMEOUT,
  setIsWasmLoaded = () => {},
}: {
  onLog?: OnLog
  debounceTimeout?: number
  setIsWasmLoaded: (isWasmLoaded: boolean) => void
}) => {
  const reInitializeTries = useRef(0)

  type InitializeWasm = (
    config: Config,
    isSwitchingWasm?: boolean
  ) => Promise<void> | undefined
  const initializeWasm: InitializeWasm = useCallback(
    debounce(async (config: Config, isSwitchingWasm = false) => {
      if (!config) {
        // onLog?.('error', 'Unable to initialize wasm. Invalid config.', config)
        onLog?.('error', {
          message: 'Unable to initialize wasm. Invalid config.',
          code: 'INVALID_WASM_CONFIG',
          data: config,
        })
        return
      }

      setIsWasmLoaded(false)

      if (await checkIfWasmLoaded()) {
        onLog?.('debug', {
          message: 'Wasm already initialized.',
          code: 'WASM_LOADED',
          data: { isSwitchingWasm },
        })
        setIsWasmLoaded(true)
        return
      }

      onLog?.('info', {
        message: 'Initializing wasm...',
        code: 'WASM_LOADING',
        data: { isSwitchingWasm },
      })

      createWasm(config, setIsWasmLoaded)

      await awaitWasmLoad()

      if (!isDesiredWasmInitiated()) {
        if (reInitializeTries.current >= MAX_RETRIES) {
          reInitializeTries.current = 0
          const msg = 'Wasm type mismatch: Unable to reset. Exiting.'
          console.warn(msg)
          onLog?.('debug', { message: msg, code: 'WASM_TYPE_MISMATCH' })
          const desiredMode = getDesiredMode()
          onLog?.('error', {
            message: `Unable to switch to ${desiredMode} mode. Please reload.`,
            code: 'WASM_TYPE_MISMATCH',
          })
          setIsWasmLoaded(true)
          return
        }

        reInitializeTries.current += 1
        const msg = `Wasm type mismatch: ${window.__zcn_wasm__?.wasmType}. Resetting ${reInitializeTries.current}/${MAX_RETRIES}`
        console.warn(msg)
        onLog?.('error', { message: msg, code: 'WASM_TYPE_MISMATCH_RETRY' })

        initializeWasm(config) // Retry initializeWasm due to wasm type mismatch
      }
    }, debounceTimeout),
    [setIsWasmLoaded]
  )

  return initializeWasm
}
