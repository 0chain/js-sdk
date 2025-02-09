import { hexStringToByte, sleep } from '@/utils'
import { getBridge } from '../bridge'

/**
 * Signs a hash using BLS signature scheme.
 *
 * @param hash The hash to be signed.
 * @returns The serialized signature in hexadecimal format.
 */
async function blsSign(hash: string, secretKey: string): Promise<string> {
  const bridge = getBridge()
  if (!bridge.jsProxy || !bridge.jsProxy.secretKey) {
    const errMsg = 'Error: bls.secretKey is not initialized'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  const bytes = hexStringToByte(hash)

  const privateKey = bridge.jsProxy.bls.deserializeHexStrToSecretKey(secretKey)
  const sig = privateKey.sign(bytes)

  if (!sig) {
    const errMsg = 'Error: WASM blsSign function failed to sign transaction'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  return sig.serializeToHexStr()
}

/**
 * Verifies a BLS signature against a given hash.
 *
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 * @returns A boolean indicating whether the signature is valid or not.
 */
async function blsVerify(signature: string, hash: string): Promise<boolean> {
  const bridge = getBridge()

  if (!bridge.jsProxy || !bridge.jsProxy.publicKey) {
    const errMsg = 'Error: bls.publicKey is not initialized'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  const bytes = hexStringToByte(hash)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  return bridge.jsProxy.publicKey.verify(sig, bytes)
}

/**
 * Verifies a BLS signature against a given hash and public key.
 *
 * @param pk The public key.
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 * @returns A boolean indicating whether the signature is valid or not.
 */
async function blsVerifyWith(
  pk: string,
  signature: string,
  hash: string
): Promise<boolean> {
  const bridge = getBridge()

  const publicKey = bridge.jsProxy.bls.deserializeHexStrToPublicKey(pk)
  const bytes = hexStringToByte(hash)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  return publicKey.verify(sig, bytes)
}

/**
 * Adds a signature to an existing signature.
 *
 * @param secretKey The secret key.
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 *
 * @returns The serialized signature in hexadecimal format.
 */
async function blsAddSignature(
  secretKey: string,
  signature: string,
  hash: string
): Promise<string> {
  const bridge = getBridge()
  if (!bridge.jsProxy) {
    const errMsg = 'Error: bls.secretKey is not initialized'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  const privateKey = bridge.jsProxy.bls.deserializeHexStrToSecretKey(secretKey)
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature)
  var sig2 = privateKey.sign(hexStringToByte(hash))
  if (!sig2) {
    const errMsg =
      'Error: WASM blsAddSignature function failed to sign transaction'
    console.warn(errMsg)
    throw new Error(errMsg)
  }

  sig.add(sig2)

  return sig.serializeToHexStr()
}

export async function createObjectURL(
  buf: ArrayBuffer,
  mimeType: string
): Promise<string> {
  var blob = new Blob([buf], { type: mimeType })
  return URL.createObjectURL(blob)
}

export const getJsProxy = (): {
  secretKey: string | null
  publicKey: string | null
} & JsProxyMethods => {
  return {
    secretKey: null,
    publicKey: null,
    sign: blsSign,
    verify: blsVerify,
    verifyWith: blsVerifyWith,
    addSignature: blsAddSignature,
    createObjectURL,
    sleep,
  }
}

export type JsProxyMethods = {
  sign: typeof blsSign
  verify: typeof blsVerify
  verifyWith: typeof blsVerifyWith
  addSignature: typeof blsAddSignature
  createObjectURL: typeof createObjectURL
  sleep: typeof sleep
}
