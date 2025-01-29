export type Domain = 'mainnet.zus.network' | 'devnet.zus.network'

export type Wallet = {
  id?: string
  temp_id?: string
  name: string
  mnemonic: string
  source_client_id: string
  client_key?: string
  public_key: string
  keys: {
    privateKey: string
    publicKey?: string
    walletMnemonic: string
  }
  is_split?: boolean
  peer_public_key?: string
  zauth_host?: `https://zauth.${Domain}`
}
