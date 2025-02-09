import { createWasm } from '../createWasm'
import debounce from 'lodash.debounce'
import type { OnLog } from '@/types/log'
import type { Config } from '../createWasm/bridge'
import { sleep } from '@/utils'
import { resetGoWasm } from '@/setup/wasm/wasm'
import type { WasmType } from '@/types'

const DEBOUNCE_TIMEOUT = 500
const MAX_RETRIES = 3

export type WasmLoaderOptions = {
  onLog?: OnLog | undefined
  debounceTimeout?: number | undefined
  setIsWasmLoaded?: ((isWasmLoaded: boolean) => void) | undefined
  getRetries: () => number
  incrementRetries: () => void
  resetRetries: () => void
}

export type InitializeWasm = (
  config: Config,
  isSwitchingWasm?: boolean
) => Promise<void> | undefined

export const createWasmLoader = ({
  onLog,
  debounceTimeout = DEBOUNCE_TIMEOUT,
  setIsWasmLoaded = () => {},
  getRetries,
  incrementRetries,
  resetRetries,
}: WasmLoaderOptions): InitializeWasm => {
  const initializeWasm: InitializeWasm = debounce(
    async (config: Config, isSwitchingWasm = false) => {
      if (!config) {
        onLog?.('error', {
          message: 'Unable to initialize WASM. Invalid config.',
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
        message: 'Initializing WASM...',
        code: 'WASM_LOADING',
        data: { isSwitchingWasm },
      })

      createWasm(config, setIsWasmLoaded)

      await awaitWasmLoad()

      if (!isDesiredWasmInitialized()) {
        if (getRetries() >= MAX_RETRIES) {
          resetRetries()
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

        incrementRetries()
        const msg = `Wasm type mismatch: ${
          window.__zcn_wasm__?.wasmType
        }. Resetting ${getRetries()}/${MAX_RETRIES}`
        console.warn(msg)
        onLog?.('error', { message: msg, code: 'WASM_TYPE_MISMATCH_RETRY' })

        initializeWasm(config) // Retry initializeWasm due to WASM type mismatch
      }
    },
    debounceTimeout
  )

  return initializeWasm
}

// ----------------------------------------
// Utils
// ----------------------------------------

export const getDesiredMode = (): WasmType => {
  const isEnterpriseModeDesired =
    localStorage.getItem('enterpriseAlloc') === 'enabled'
  return isEnterpriseModeDesired ? 'enterprise' : 'normal'
}

/** @param onLog Optional logger, e.g., console.log */
export const isDesiredWasmInitialized = (onLog?: OnLog): boolean => {
  const isEnterpriseModeDesired =
    localStorage.getItem('enterpriseAlloc') === 'enabled'
  const wasmType = window.__zcn_wasm__?.wasmType

  if (wasmType === undefined) {
    // This is for old WASM versions which don't have wasmType
    onLog?.('debug', {
      message: 'Wasm type: undefined',
      code: 'OUTDATED_WASM_VERSION',
    })
    return true
  }

  return isEnterpriseModeDesired
    ? wasmType === 'enterprise'
    : wasmType === 'normal'
}

/** @param onLog Optional logger, e.g., console.log */
export const awaitWasmLoad = async (onLog?: OnLog): Promise<void> => {
  while (!window.__zcn_wasm__?.__wasm_initialized__) {
    onLog?.('debug', { message: 'Wasm: Waiting...', code: 'WASM_LOADING' })
    await sleep(500)
  }

  onLog?.('info', {
    message: `Wasm: Loaded. Type: ${window.__zcn_wasm__.wasmType}`,
    code: 'WASM_LOADED',
  })

  await sleep(1000) // This avoids the error shown here: https://0chain.slack.com/archives/G01EXH6EYC9/p1729268246489569?thread_ts=1729214879.267689&cid=G01EXH6EYC9
}

export const checkIfWasmLoaded = async (): Promise<boolean> => {
  if (window.__zcn_wasm__?.__wasm_initialized__) {
    await sleep(300) // This avoids the error shown here: https://0chain.slack.com/archives/G01EXH6EYC9/p1729268246489569?thread_ts=1729214879.267689&cid=G01EXH6EYC9

    if (!isDesiredWasmInitialized()) {
      resetGoWasm()
      return false
    }

    return true
  }
  return false
}
