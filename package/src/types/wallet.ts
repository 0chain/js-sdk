export type Domain = 'mainnet.zus.network' | 'devnet.zus.network'
export type NetworkDomain = Domain | (string & {})
export type NetworkConfig = {
  /** Chain ID  */
  chainId?: string
  /** signatureScheme is the Signature scheme used for signing transactions */
  signatureScheme?: string
  /** minConfirmation is the minimum number of confirmations required for a transaction to be considered final */
  minConfirmation?: number
  /** minSubmit is the minimum number of times a transaction must be submitted to the network */
  minSubmit?: number
  /** confirmationChainLength is the number of blocks to wait for a transaction to be confirmed */
  confirmationChainLength?: number
  /** sharderConsensus is the number of sharders to reach consensus */
  sharderConsensus?: number
  /** zboxHost is the url of the 0box service */
  zboxHost?: `https://0box.${Domain}` | (string & {})
  /** blockWorker is the block worker url */
  blockWorker?: `https://${Domain}/dns` | (string & {})
}

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

export type Transaction = {
  hash?: string
  version?: string
  client_id?: string
  public_key?: string
  to_client_id?: string
  chain_id?: string
  transaction_data: string
  transaction_value: number
  signature?: string
  creation_date?: number
  transaction_type: number
  transaction_output?: string
  transaction_fee: number
  transaction_nonce: number
  txn_output_hash: string
  transaction_status: number
}

export const providerTypes = {
  miner: 1,
  sharder: 2,
  blobber: 3,
  validator: 4,
  authorizer: 5,
} as const

export type ProviderType = keyof typeof providerTypes
export const getProviderTypeId = (providerType: ProviderType): number => {
  return providerTypes[providerType]
}

/** StakePoolInfo is the information of stake pool of a provider */
export type StakePoolInfo = {
  pool_id: string
  balance: number
  stake_total: number
  delegate: StakePoolDelegatePoolInfo[]
  rewards: number
  total_rewards: number
  settings: StakePoolSettings
}

/** StakePoolDelegatePoolInfo represents delegate pool of a stake pool info */
type StakePoolDelegatePoolInfo = {
  id: string
  balance: number
  delegate_id: string
  rewards: number
  unstake: boolean
  total_reward: number
  total_penalty: number
  status: string
  round_created: number
  staked_at: number
}

type StakePoolSettings = {
  delegate_wallet: string
  num_delegates: number
  service_charge: number
}
