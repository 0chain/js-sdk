export { createWasm } from '../setup/createWasm'
export {
  checkIfWasmLoaded,
  awaitWasmLoad,
  updateWasmMode,
  getDesiredMode,
  isDesiredWasmInitialized,
} from '../setup/wasmLoader/createWasmLoader'
export { getWasm, resetGoWasm } from '../setup/wasm'
export * from '../sdk'
export { wasmLoader } from '../setup/wasmLoader/wasmLoader'
