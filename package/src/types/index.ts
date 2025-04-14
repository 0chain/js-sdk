// export type AccountEntity = {
//   id: string
//   public_key: string
//   secretKey: string
//   timeStamp: number
// }

// export type ReqHeaders = Record<string, string | number>
export type WasmType = 'normal' | 'enterprise'

export type * from './allocation'
export type * from './blobber'
export type * from './log'
export type * from './wallet'
