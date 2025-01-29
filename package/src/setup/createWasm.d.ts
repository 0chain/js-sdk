type SetIsWasmLoaded = (isLoaded: boolean) => void

export type Config =
  | {
      /**
       * `wasmBaseUrl` is the base URL of your enterprise-zcn.wasm & zcn.wasm
       *
       * Example: if `wasmBaseUrl` is `https://example.com/wasm` then WASM files
       * should be located at:
       * - `https://example.com/wasm/enterprise-zcn.wasm` for Enterprise WASM
       * - `https://example.com/wasm/zcn.wasm` for Standard WASM
       */
      wasmBaseUrl?: string
      zus?: ZusConfig
    }
  | (
      | { useCachedWasm?: false; cacheConfig?: never }
      | { useCachedWasm: true; cacheConfig: CacheConfig }
    )

type CacheConfig = {
  enterpriseGosdkVersion: string
  enterpriseWasmUrl?: string
  standardGosdkVersion: string
  standardWasmUrl?: string
}

type ZusConfig = {
  cdnUrl?: string
}

export declare function createWasm(
  config?: Config,
  setIsWasmLoaded: SetIsWasmLoaded
): Promise<any>

export declare function sleep(ms: number): Promise<void>

// const jsProxyMethods = {
//   sign: blsSign,
//   verify: blsVerify,
//   verifyWith: blsVerifyWith,
//   createObjectURL,
//   sleep,
// }
// export type JsProxyMethods = typeof jsProxyMethods

// const sdkProxyMethods = {
//   bulkUpload,
//   setWallet,
// }
// export type SdkProxyMethods = typeof sdkProxyMethods
