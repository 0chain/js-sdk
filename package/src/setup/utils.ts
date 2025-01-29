/**
 * Converts a hexadecimal string to a Uint8Array.
 *
 * @param str The hexadecimal string to convert.
 * @returns The Uint8Array bytes representation of the hexadecimal string.
 */
export const hexStringToByte = (str: string) => {
  if (!str) return new Uint8Array()

  const a: number[] = []
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substring(i, i + 2), 16))
  }
  return new Uint8Array(a)
}

export async function createObjectURL(buf: ArrayBuffer, mimeType: string) {
  var blob = new Blob([buf], { type: mimeType })
  return URL.createObjectURL(blob)
}

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

export const globalCtx = () => {
  if (typeof window !== 'undefined') return window || globalThis || self
  else {
    console.error('Window object not available')
    return {} as Window
  }
}

export const md5Hash = async (file: File) => {
  const result = new Promise<string>((resolve, reject) => {
    const worker = new Worker('md5worker.js') // TODO
    worker.postMessage(file)
    worker.onmessage = e => {
      resolve(e.data)
      worker.terminate()
    }
    worker.onerror = reject
  })

  return result
}
