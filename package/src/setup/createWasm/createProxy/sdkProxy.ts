import { Bridge, getBridge, globalCtx } from '../bridge'

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

const readChunk = (offset: number, chunkSize: number, file: File) =>
  new Promise<{ size: number; buffer: Uint8Array }>((res, rej) => {
    const fileReader = new FileReader()
    const blob = file.slice(offset, chunkSize + offset)
    fileReader.onload = e => {
      const t = e.target
      if (t === null) {
        rej('err: fileReader onload target is null')
        return
      }
      if (t.error == null) {
        const result = t.result as ArrayBuffer
        res({
          size: result.byteLength,
          buffer: new Uint8Array(result),
        })
      } else {
        rej(t.error)
      }
    }

    fileReader.readAsArrayBuffer(blob)
  })

const getProxy = (bridge: Bridge) => {
  const proxy = bridge.__proxy__
  if (!proxy) {
    throw new Error(
      'The Bridge proxy (__proxy__) is not initialized. Make sure to call createWasm first.'
    )
  }
  return proxy
}

export type UploadObject = {
  allocationId: string
  remotePath: string
  file: File
  thumbnailBytes: Uint8Array
  encrypt: boolean
  isUpdate: boolean
  isRepair: boolean
  numBlocks: number
  callback: (totalBytes: number, completedBytes: number, error: any) => void
  /** @deprecated */
  webstreaming: boolean
}

/**
 * Performs a bulk upload of multiple files.
 *
 * @param options An array of upload options for each file.
 * @returns // TODO - return type
 */
export async function bulkUpload(options: UploadObject[]) {
  const g = globalCtx()
  const bridge = getBridge()

  const start = bridge.glob.index
  const opts = options.map(obj => {
    const i = bridge.glob.index
    bridge.glob.index++
    const readChunkFuncName = '__zcn_upload_reader_' + i.toString()
    const callbackFuncName = '__zcn_upload_callback_' + i.toString()
    let md5HashFuncName = ''

    g[readChunkFuncName] = async (offset: number, chunkSize: number) => {
      console.log(
        'bulk_upload: read chunk remotePath:' +
          obj.remotePath +
          ' offset:' +
          offset +
          ' chunkSize:' +
          chunkSize
      )
      const chunk = await readChunk(offset, chunkSize, obj.file)
      return chunk.buffer
    }

    if (obj.file.size > 25 * 1024 * 1024) {
      md5HashFuncName = '__zcn_md5_hash_' + i.toString()
      const md5Res = md5Hash(obj.file)
      g[md5HashFuncName] = async () => {
        const hash = await md5Res
        return hash
      }
    }

    if (obj.callback) {
      g[callbackFuncName] = async (
        totalBytes: number,
        completedBytes: number,
        error: any
      ) => obj.callback(totalBytes, completedBytes, error)
    }

    return {
      allocationId: obj.allocationId,
      remotePath: obj.remotePath,
      fileSize: obj.file.size,
      encrypt: obj.encrypt,
      isUpdate: obj.isUpdate,
      isRepair: obj.isRepair,
      numBlocks: obj.numBlocks,
      webstreaming: obj.webstreaming,
      thumbnailBytes: Array.from(obj?.thumbnailBytes || []).toString(),
      readChunkFuncName: readChunkFuncName,
      callbackFuncName: callbackFuncName,
      md5HashFuncName: md5HashFuncName,
    }
  })

  const end = bridge.glob.index

  const proxy = getProxy(bridge)
  const result = await proxy.sdk.bulkUpload(JSON.stringify(opts))
  for (let i = start; i < end; i++) {
    g['__zcn_upload_reader_' + i.toString()] = null
    g['__zcn_upload_callback_' + i.toString()] = null
  }
  return result
}

/**
 * Sets the wallet information in the bridge and the Go instance.
 *
 * @param bls The BLS object from bls-wasm script.
 * @param clientID The client ID.
 * @param clientKey The client key.
 * @param peerPublicKey The peer public key.
 * @param sk The serialized secret key.
 * @param pk The serialized public key.
 * @param mnemonic The mnemonic.
 * @param isSplit Whether the wallet has split keys enabled or not.
 */
export async function setWallet(
  bls: any, // TODO: check bls
  clientID: string,
  clientKey: string,
  peerPublicKey: string,
  sk: string,
  pk: string,
  mnemonic: string,
  isSplit: boolean
) {
  if (!bls) throw new Error('bls is undefined')
  if (!sk) throw new Error('secret key is undefined')
  if (!pk) throw new Error('public key is undefined')
  if (isSplit && !clientKey) throw new Error('clientKey is undefined')

  const bridge = getBridge()

  if (
    bridge.walletId != clientID ||
    bridge.jsProxy.pubkeyStr != pk ||
    bridge.jsProxy.isSplit != isSplit
  ) {
    bridge.jsProxy.bls = bls
    bridge.jsProxy.secretKey = bls.deserializeHexStrToSecretKey(sk)
    bridge.jsProxy.publicKey = bls.deserializeHexStrToPublicKey(pk)
    bridge.jsProxy.pubkeyStr = pk
    bridge.jsProxy.isSplit = isSplit

    const proxy = getProxy(bridge)

    if (!proxy?.sdk?.setWallet)
      throw new Error('proxy.sdk.setWallet is not defined')
    await proxy.sdk.setWallet(
      clientID,
      clientKey,
      peerPublicKey,
      pk,
      sk,
      mnemonic,
      isSplit
    )
    bridge.walletId = clientID
    bridge.secretKey = sk
    bridge.peerPublicKey = peerPublicKey
  }
}

export type SdkProxyMethods = {
  bulkUpload: typeof bulkUpload
  setWallet: typeof setWallet
}
