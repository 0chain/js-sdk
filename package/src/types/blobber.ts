export type ListResult = {
  consensus: any
  deleteMask: string
} & FileRef

export type FileRef = {
  client_id: string
  name: string
  path?: string
  type: string
  size: number
  hash?: string
  file_meta_hash?: string
  num_blocks: number
  lookup_hash: string
  encryption_key: string
  actual_size: number
  actual_num_blocks: number
  thumbnail_hash?: string
  thumbnail_size: number
  actual_thumbnail_hash?: string
  actual_thumbnail_size: number
  num_files: number
  created_at: number
  updated_at: number
  list: ListResult[] | null
  storage_version: number
  mimetype?: string
  parent_path?: string
}

/** Collaborator information. */
interface Collaborator {
  ref_id: number
  client_id: string
  created_at: string
}

export type GolangFileRefByName = {
  Name: string
  Type: string
  Path: string
  LookupHash: string
  Hash: string
  MimeType: string
  Size: number
  NumBlocks: number
  ActualFileSize: number
  ActualNumBlocks: number
  EncryptedKey: string
  FileMetaHash: string
  ThumbnailHash: string
  ActualThumbnailSize: number
  ActualThumbnailHash: string
  Collaborators: Collaborator[]
  CreatedAt: number
  UpdatedAt: number
}

export type FileRefByName = {
  name: string
  type: string
  path: string
  lookup_hash: string
  hash: string
  mimetype: string
  size: number
  num_blocks: number
  actual_size: number
  actual_num_blocks: number
  encryption_key: string
  file_meta_hash: string
  thumbnail_hash: string
  actual_thumbnail_size: number
  actual_thumbnail_hash: string
  collaborators: Collaborator[]
  created_at: number
  updated_at: number
  fromSearch?: boolean
}

export type Blobber = {
  /** ID of the blobber */
  id: string
  /** BaseURL of the blobber */
  url: string
  /** Terms of the blobber */
  terms: Terms
  /** Capacity of the blobber */
  capacity: number
  /** Allocated size of the blobber */
  allocated: number
  /** LastHealthCheck of the blobber */
  last_health_check: string
  /** PublicKey of the blobber */
  public_key: string
  /** StakePoolSettings settings of the blobber staking */
  stake_pool_settings: StakePoolSettings
  /** TotalStake of the blobber in SAS */
  total_stake: number
  /** UsedAllocation of the blobber in SAS */
  used_allocation: number
  /** TotalOffers of the blobber in SAS */
  total_offers: number
  /** TotalServiceCharge of the blobber in SAS */
  total_service_charge: number
  /** UncollectedServiceCharge of the blobber in SAS */
  uncollected_service_charge: number
  /** IsKilled flag of the blobber, if true then the blobber is killed */
  is_killed: boolean
  /** IsShutdown flag of the blobber, if true then the blobber is shutdown */
  is_shutdown: boolean
  /** NotAvailable flag of the blobber, if true then the blobber is not available */
  not_available: boolean
  /** IsRestricted flag of the blobber, if true then the blobber is restricted */
  is_restricted: boolean
}

type StakePoolSettings = {
  delegate_wallet?: string
  num_delegates?: number
  service_charge?: number
}

type Terms = {
  max_offer_duration: number
  read_price: number
  write_price: number
}

export type Transaction = {
  chain_id?: string
  client_id?: string
  creation_date?: number
  hash?: string
  output_hash?: string
  public_key?: string
  signature?: string
  status?: number
  to_client_id?: string
  transaction_data: string
  transaction_fee: number
  transaction_nonce?: number
  transaction_output?: string
  transaction_type: number
  transaction_value: number
  version?: string
}
