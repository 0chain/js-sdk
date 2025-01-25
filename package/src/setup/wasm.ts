export const resetGoWasm = () => {
  window.__zcn_wasm__ = undefined
  window.newGoWasm = undefined
  window.createWasmPromise = undefined
}
