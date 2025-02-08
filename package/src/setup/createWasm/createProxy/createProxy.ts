import { sleep } from '@/utils'
import { getBridge, type Bridge, type GoInstance } from '../bridge'
import { bulkUpload, setWallet } from './sdkProxy'

// TODO: the return type can be seen from proxy.go in gosdk
const createSdkProxyObject = (go: GoInstance): any => {
  const bridge = getBridge()

  const sdkProxy = new Proxy(
    {},
    {
      get:
        (_, key) =>
        (...args: any[]) =>
          new Promise(async (resolve, reject) => {
            if (!go || go.exited) {
              return reject(new Error('The Go instance is not active.'))
            }

            while (bridge.__wasm_initialized__ !== true) {
              await sleep(1000)
            }

            if (typeof bridge.sdk[key] !== 'function') {
              resolve(bridge.sdk[key])

              if (args.length !== 0) {
                reject(
                  new Error(
                    'Retrieved value from WASM returned function type, however called with arguments.'
                  )
                )
              }
              return
            }

            try {
              let resp = bridge.sdk[key].apply(undefined, args)

              // support wasm.BindAsyncFunc
              if (resp && typeof resp.then === 'function') {
                resp = await Promise.race([resp])
              }

              if (resp && resp.error) {
                reject(resp.error)
              } else {
                resolve(resp)
              }
            } catch (e) {
              reject(e)
            }
          }),
    }
  )

  return sdkProxy
}

// We don't care about the return type because JS proxy methods are only used by gosdk wasm.
const createJsProxyObject = (): any => {
  const bridge = getBridge()

  const jsProxy = new Proxy(
    {},
    {
      get: <T extends keyof Bridge['jsProxy']>(_: {}, key: T) => {
        return bridge.jsProxy[key]
      },
      set: <T extends keyof Bridge['jsProxy']>(
        _: {},
        key: T,
        value: Bridge['jsProxy'][T]
      ) => {
        bridge.jsProxy[key] = value
        return true
      },
    }
  )

  return jsProxy
}

export type GoWasmProxy = {
  /** @deprecated */
  bulkUpload: typeof bulkUpload
  setWallet: typeof setWallet
  getWalletId: () => Bridge['walletId']
  getPrivateKey: () => Bridge['secretKey']
  getPeerPublicKey: () => Bridge['peerPublicKey']
  sdk: ReturnType<typeof createSdkProxyObject>
  jsProxy: ReturnType<typeof createJsProxyObject>
}

export const createProxy = (go: GoInstance): GoWasmProxy => {
  const sdkProxy = createSdkProxyObject(go)
  const jsProxy = createJsProxyObject()

  const bridge = getBridge()
  const proxy = {
    bulkUpload,
    setWallet,
    getWalletId: () => bridge.walletId,
    getPrivateKey: () => bridge.secretKey,
    getPeerPublicKey: () => bridge.peerPublicKey,
    sdk: sdkProxy, // Expose sdk methods for js
    jsProxy, // Expose js methods for go
  }

  return proxy
}
