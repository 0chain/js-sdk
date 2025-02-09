export { createWasm } from '../setup/createWasm'
export {
  awaitWasmLoad,
  checkIfWasmLoaded,
  getDesiredMode,
  isDesiredWasmInitialized,
} from '../setup/wasmLoader/createWasmLoader'
export { getWasm, resetGoWasm } from '../setup/wasm'
export { updateWasmMode } from '../setup/updateWasmMode'
export * from '../sdk'
export { wasmLoader } from '../setup/wasmLoader/wasmLoader'
