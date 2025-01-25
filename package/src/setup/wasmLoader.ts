import { OnLog } from '../types'
import { sleep } from './createWasm'
import { resetGoWasm } from './wasm'

export const getDesiredMode = () => {
  const isEnterpriseModeDesired =
    localStorage.getItem('enterpriseAlloc') === 'enabled'
  return isEnterpriseModeDesired ? 'enterprise' : 'normal'
}

/** @param onLog Optional logger, e.g., console.log */
export const isDesiredWasmInitiated = (onLog?: OnLog) => {
  const isEnterpriseModeDesired =
    localStorage.getItem('enterpriseAlloc') === 'enabled'
  const wasmType = window.__zcn_wasm__?.wasmType

  if (wasmType === undefined) {
    // This is for old wasm versions which don't have wasmType
    onLog?.('debug', 'Wasm type: undefined')
    return true
  }

  return isEnterpriseModeDesired
    ? wasmType === 'enterprise'
    : wasmType === 'normal'
}

/** @param onLog Optional logger, e.g., console.log */
export const awaitWasmLoad = async (onLog?: OnLog) => {
  while (!window.__zcn_wasm__?.__wasm_initialized__) {
    onLog?.('debug', 'Wasm: Waiting...')
    await sleep(500)
  }

  onLog?.('info', `Wasm: Loaded. Type: ${window.__zcn_wasm__.wasmType}`)

  await sleep(1000) // This avoids the error shown here: https://0chain.slack.com/archives/G01EXH6EYC9/p1729268246489569?thread_ts=1729214879.267689&cid=G01EXH6EYC9
}

export const checkIfWasmLoaded = async () => {
  if (window.__zcn_wasm__?.__wasm_initialized__) {
    await sleep(300) // This avoids the error shown here: https://0chain.slack.com/archives/G01EXH6EYC9/p1729268246489569?thread_ts=1729214879.267689&cid=G01EXH6EYC9

    if (!isDesiredWasmInitiated()) {
      resetGoWasm()
      return false
    }

    return true
  }
  return false
}
