export type Allocation = {
  /** ID is the unique identifier of the allocation. */
  id: string
  /** Tx is the transaction hash of the latest transaction related to the allocation. */
  tx: string
  /** DataShards is the number of data shards. */
  data_shards: number
  /** ParityShards is the number of parity shards. */
  parity_shards: number
  /** Size is the size of the allocation. */
  size: number
  /** Expiration is the expiration date of the allocation. */
  expiration_date: number
  /** Owner is the id of the owner of the allocation. */
  owner_id: string
  /** OwnerPublicKey is the public key of the owner of the allocation. */
  owner_public_key: string
  /** Payer is the id of the payer of the allocation. */
  payer_id: string
  /** Blobbers is the list of blobbers that store the data of the allocation. */
  blobbers: StorageNode[]
  /** Stats contains the statistics of the allocation. */
  stats: AllocationStats
  /** TimeUnit is the time unit of the allocation. */
  time_unit: number
  /** WritePool is the write pool of the allocation. */
  write_pool: number
  /**
   * BlobberDetails contains real terms used for the allocation.
   *
   * If the allocation has updated, then terms are calculated using weighted average values.
   */
  blobber_details: BlobberDetails[]
  /** ReadPriceRange is requested reading prices range. */
  read_price_range: PriceRange
  /** WritePriceRange is requested writing prices range. */
  write_price_range: PriceRange
  /** MinLockDemand is the minimum lock demand of the allocation. */
  min_lock_demand: number
  /** ChallengeCompletionTime is the time taken to complete a challenge. */
  challenge_completion_time: number
  /** StartTime is the start time of the allocation. */
  start_time: number
  /** Finalized is the flag to indicate if the allocation is finalized. */
  finalized?: boolean
  /** Cancelled is the flag to indicate if the allocation is cancelled. */
  canceled?: boolean
  /** MovedToChallenge is the amount moved to challenge pool related to the allocation. */
  moved_to_challenge?: number
  /** MovedBack is the amount moved back from the challenge pool related to the allocation. */
  moved_back?: number
  /** MovedToValidators is the amount moved to validators related to the allocation. */
  moved_to_validators?: number
  /** Owner ECDSA public key */
  owner_signing_public_key: string
  /**
   * setThirdPartyExtendable is a flag that determines whether third-parties are allowed to update the allocation's size and expiration property.
   *
   * When set to `true`, third-parties / a non-owner client (e.g., 0box) can update or modify the allocation
   */
  third_party_extendable: boolean
  /**
   * FileOptions is a bitmask of file options, which represents the permissions of the allocation.
   *
   * Default value is `00000000`, suggesting that owner has abilities to perform all crud operations like upload, delete, update, move, copy, rename
   * Bitmask options are:
   * - `00000001` - 1  - upload
   * - `00000010` - 2  - delete
   * - `00000100` - 4  - update
   * - `00001000` - 8  - move
   * - `00010000` - 16 - copy
   * - `00100000` - 32 - rename
   */
  file_options: number
  /** IsEnterprise is a flag to indicate if the allocation is an enterprise allocation. */
  is_enterprise: boolean
  /** StorageVersion is the storage version of the allocation. */
  storage_version: number
}

/** StorageNode represents a storage node (blobber) */
type StorageNode = {
  id: string
  url: string
  LatestWM: WriteMarker | null
}

type WriteMarker = {
  allocation_root: string
  prev_allocation_root: string
  file_meta_root: string
  allocation_id: string
  size: number
  chain_size: number
  chain_hash: string
  chain_length: number
  blobber_id: string
  timestamp: number
  client_id: string
  signature: string
}

type AllocationStats = {
  used_size: number
  num_of_writes: number
  num_of_reads: number
  total_challenges: number
  num_open_challenges: number
  num_success_challenges: number
  num_failed_challenges: number
  latest_closed_challenge: string
}

/** BlobberAllocation represents the blobber in the context of an allocation */
type BlobberDetails = {
  blobber_id: string
  size: number
  terms: Terms
  min_lock_demand: number
  spent: number
  penalty: number
  read_reward: number
  returned: number
  challenge_reward: number
  final_reward: number
}

/** Terms represents Blobber terms. A Blobber can update its terms, but any existing offer will use terms of offer signing time. */
type Terms = {
  max_offer_duration: number
  /** tokens / GB */
  read_price: number
  /** tokens / GB */
  write_price: number
}

/** PriceRange represents a price range allowed by user to filter blobbers. */
type PriceRange = {
  min: number
  max: number
}
