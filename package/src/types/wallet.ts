export type Domain = 'mainnet.zus.network' | 'devnet.zus.network'
export type NetworkDomain = Domain | (string & {})

export type ActiveWallet = {
  id?: string
  temp_id?: string
  name?: string
  source_client_id?: string | null
  client_key?: string
  public_key?: string
  mnemonic?: string
  keys?: {
    privateKey: string
    publicKey: string
    walletMnemonic?: string
  }
  is_split?: boolean
  peer_public_key?: string
  zauth_host?: `https://zauth.${Domain}` | (string & {})
}
