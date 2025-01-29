/**
 * Sleep is used when awaiting for Go Wasm to initialize.
 * It uses the lowest possible sane delay time (via requestAnimationFrame).
 * However, if the window is not focused, requestAnimationFrame never returns.
 * A timeout will ensure to be called after 50 ms, regardless of whether or not
 * the tab is in focus.
 */
export const sleep = (ms = 1000) => {
  return new Promise<number | void>(resolve => {
    requestAnimationFrame(resolve)
    setTimeout(resolve, ms)
  })
}
