import { getBls, hexStringToByte } from '@/utils'
import { generateMnemonic, mnemonicToSeed } from 'bip39'
import sha3 from 'js-sha3'

export const getBip39MnemonicSeedBuffer = async (
  customBip39Mnemonic?: string
) => {
  const mnemonic = customBip39Mnemonic || generateMnemonic(256)
  const seed = await mnemonicToSeed(mnemonic, '0chain-client-split-key')
  const buffer = new Uint8Array(seed)
  return { mnemonic, buffer }
}

export const getBlsKeys = async (
  bip39MnemonicSeedBuffer: Uint8Array<ArrayBuffer>
) => {
  const bls = await getBls()
  const blsSecret = new bls.SecretKey()
  bls.setRandFunc(bip39MnemonicSeedBuffer)
  blsSecret.setLittleEndian(bip39MnemonicSeedBuffer)

  const publicKey = blsSecret.getPublicKey().serializeToHexStr() as string
  const privateKey = blsSecret.serializeToHexStr() as string
  return { publicKey, privateKey }
}

export const getSha3HashFromHexString = (hexString: string) => {
  return sha3.sha3_256(hexStringToByte(hexString))
}

export const isHash = (str: string) => {
  const regexExp = /^[a-f0-9]{64}$/gi
  return regexExp.test(str)
}
