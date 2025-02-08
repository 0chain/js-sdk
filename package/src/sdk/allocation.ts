// TODO: not used in webapps: updateAllocationWithRepair, getUpdateAllocTicket, collectRewards, getStakePoolInfo, lockStakePool, unlockStakePool (not used anywhere:- getAllocationBlobbers, getBlobberIds, reloadAllocation, getStakePoolInfo. lockWritePool, allocationRepair, repairSize)
import {
  getProviderTypeId,
  type StakePoolInfo,
  type ActiveWallet,
  type NetworkDomain,
  type ProviderType,
  type Transaction,
} from '@/types/wallet'
import { getWasm } from '@/setup/wasm'
import { errorOut } from '@/sdk/utils/misc'
import type { Allocation } from '@/types/allocation'

export const createAllocation = async ({
  wallet,
  domain,
  dataShards,
  parityShards,
  size,
  minReadPrice,
  maxReadPrice,
  minWritePrice,
  maxWritePrice,
  lock,
  blobberIds = [],
  blobberAuthTickets,
  setThirdPartyExtendable,
  isEnterprise,
  force = false,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Number of data shards. Data uploaded to the allocation will be split and distributed across these shards. */
  dataShards: number
  /** Number of parity shards. Parity shards are used to replicate datashards for redundancy. */
  parityShards: number
  /** Size of the allocation in bytes */
  size: number
  /** Minimum read price set by the client */
  minReadPrice: number
  /** Maximum read price set by the client */
  maxReadPrice: number
  /** Minimum write price set by the client */
  minWritePrice: number
  /** Maximum write price set by the client */
  maxWritePrice: number
  /** Lock value to add to the allocation */
  lock: number
  /** List of blobber IDs of your preferred blobbers for the allocation */
  blobberIds?: string[]
  /** List of blobber auth tickets in case of using restricted blobbers */
  blobberAuthTickets: string[]
  /**
   * setThirdPartyExtendable is a flag that determines whether third-parties are allowed to update the allocation's size and expiration property.
   *
   * When set to `true`, third-parties / a non-owner client (e.g., 0box) can update or modify the allocation
   */
  setThirdPartyExtendable: boolean
  /** Whether it's an enterprise allocation */
  isEnterprise: boolean
  /**
   * The `force` parameter determines whether the allocation creation should proceed even if the available blobbers are insufficient to meet the required data + parity conditions.
   *
   * By default, when `force` is `false`, the API will return a "Not enough blobbers" error if the number of available blobbers is less than the required data + parity. This ensures that the allocation meets the necessary redundancy and reliability conditions.
   *
   * When `force` is set to `true`, the API will bypass this check and proceed with the allocation creation using the available blobbers, even if they are fewer than the required data + parity shards. This can be useful in scenarios where you want to proceed with the allocation despite the reduced redundancy.
   *
   * Use this parameter with caution, as it may result in allocations with lower fault tolerance and reliability.
   */
  force: boolean
}): Promise<Transaction> => {
  const goWasm = await getWasm({ domain, wallet })

  const transactionData = await goWasm.sdk.createAllocation(
    dataShards,
    parityShards,
    size,
    minReadPrice,
    maxReadPrice,
    minWritePrice,
    maxWritePrice,
    lock,
    blobberIds,
    blobberAuthTickets,
    setThirdPartyExtendable,
    isEnterprise,
    force
  )
  return transactionData
}

/** Retrieves list of blobber IDs of the allocation */
export const getAllocationBlobbers = async ({
  wallet,
  domain,
  preferredBlobberURLs,
  dataShards,
  parityShards,
  size,
  minReadPrice,
  maxReadPrice,
  minWritePrice,
  maxWritePrice,
  restrictedLevel,
  force = false,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** List of preferred blobber URLs */
  preferredBlobberURLs: string[]
  /** Number of data shards */
  dataShards: number
  /** Number of parity shards */
  parityShards: number
  /** Size of the allocation in bytes */
  size: number
  /** Minimum read price */
  minReadPrice: number
  /** Maximum read price */
  maxReadPrice: number
  /** Minimum write price */
  minWritePrice: number
  /** Maximum write price */
  maxWritePrice: number
  /**
   * Specifies the type of blobbers to query.
   *
   * - `0`: Use all blobbers (both restricted and non-restricted).
   * - `1`: Use only restricted blobbers (require permission for allocation creation).
   * - `2`: Use only non-restricted blobbers (do not require permission for allocation creation).
   */
  restrictedLevel: number
  /**
   * @deprecated For internal use only
   * @default false
   */
  force: boolean
}): Promise<string[]> => {
  const goWasm = await getWasm({ domain, wallet })

  const blobberIds = await goWasm.sdk.getAllocationBlobbers(
    preferredBlobberURLs,
    dataShards,
    parityShards,
    size,
    minReadPrice,
    maxReadPrice,
    minWritePrice,
    maxWritePrice,
    restrictedLevel,
    force
  )

  return blobberIds
}

export const getBlobberIds = async ({
  wallet,
  domain,
  blobberUrls,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** List of blobber URLs for which IDs need to be retrieved */
  blobberUrls: string[]
}): Promise<string[]> => {
  const goWasm = await getWasm({ domain, wallet })

  const blobberIds = await goWasm.sdk.getBlobberIds(blobberUrls)
  return blobberIds
}

export const listAllocations = async ({
  wallet,
  domain,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
}): Promise<Allocation[]> => {
  const goWasm = await getWasm({ domain, wallet })
  const allocations = await goWasm.sdk.listAllocations()
  return allocations
}

/** getAllocation gets allocation details using `allocationId` from cache
 *  - if not found in cache, fetch from blockchain and store in cache */
export const getAllocation = async ({
  wallet,
  domain,
  allocationId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
}): Promise<Allocation> => {
  const goWasm = await getWasm({ domain, wallet })

  return await goWasm.sdk.getAllocation(allocationId)
}

/** reloadAllocation reload allocation details using `allocationId` from blockchain and update cache */
export const reloadAllocation = async ({
  wallet,
  domain,
  allocationId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
}): Promise<Allocation> => {
  const goWasm = await getWasm({ domain, wallet })
  return await goWasm.sdk.reloadAllocation(allocationId)
}

/** transferAllocation transfers the ownership of an allocation to a new owner */
export const transferAllocation = async ({
  wallet,
  domain,
  allocationId,
  newOwnerId,
  newOwnerPublicKey,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** New owner ID */
  newOwnerId: string
  /** New owner public key */
  newOwnerPublicKey: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.transferAllocation(
    allocationId,
    newOwnerId,
    newOwnerPublicKey
  )
}

/**
 * freezeAllocation freezes one of the client's allocations, given its ID
 *
 * Freezing the allocation will forbid all the operations on the files in the allocation.
 *
 * @returns the hash of the transaction
 */
export const freezeAllocation = async ({
  wallet,
  domain,
  allocationId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Allocation ID to freeze */
  allocationId: string
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.freezeAllocation(allocationId)
  return txnHash
}

/**
 * cancelAllocation cancels an allocation using `allocationId`
 *
 * @returns the hash of the transaction
 */
export const cancelAllocation = async ({
  wallet,
  domain,
  allocationId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Allocation ID to cancel */
  allocationId: string
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.cancelAllocation(allocationId)
  return txnHash
}

/** updateAllocation updates the allocation settings */
export const updateAllocation = async ({
  wallet,
  domain,
  allocationId,
  size,
  extend,
  lock,
  addBlobberId,
  addBlobberAuthTicket,
  removeBlobberId,
  ownerSigningPublicKey,
  setThirdPartyExtendable,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Allocation ID to update */
  allocationId: string
  /** New size of the allocation */
  size: number
  /** Extend flag, whether to extend the allocation's expiration date */
  extend: boolean
  /** Lock value to add to the allocation */
  lock: number
  /** Blobber ID to add to the allocation */
  addBlobberId: string
  /** Blobber auth ticket to add to the allocation, in case of restricted blobbers */
  addBlobberAuthTicket: string
  /** Blobber ID to remove from the allocation */
  removeBlobberId: string
  /** Owner ECDSA public key */
  ownerSigningPublicKey?: string
  /** Third party extendable flag, if true, the allocation can be extended (in terms of size) by a non-owner client */
  setThirdPartyExtendable: boolean
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.updateAllocation(
    allocationId,
    size,
    extend,
    lock,
    addBlobberId,
    addBlobberAuthTicket,
    removeBlobberId,
    ownerSigningPublicKey,
    setThirdPartyExtendable
  )
  return txnHash
}

export const updateAllocationWithRepair = async ({
  wallet,
  domain,
  allocationId,
  size,
  extend,
  lock,
  addBlobberId,
  addBlobberAuthTicket,
  removeBlobberId,
  ownerSigningPublicKey,
  updateAllocTicket,
  callback,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Allocation ID to update */
  allocationId: string
  /** New size of the allocation */
  size: number
  /** Extend flag, whether to extend the allocation's expiration date */
  extend: boolean
  /** Lock value to add to the allocation */
  lock: number
  /** Blobber ID to add to the allocation */
  addBlobberId: string
  /** Blobber auth ticket to add to the allocation, in case of restricted blobbers */
  addBlobberAuthTicket: string
  /** Blobber ID to remove from the allocation */
  removeBlobberId: string
  /** Owner ECDSA public key */
  ownerSigningPublicKey: string
  /** Update allocation ticket */
  updateAllocTicket: string
  /** Callback function will be invoked with repair progress updates */
  callback?: (
    totalBytes: number,
    completedBytes: number,
    fileName: string,
    blobURL: string,
    error: string
  ) => void
}): Promise<string> => {
  let callbackFuncName = ''
  if (callback) {
    callbackFuncName = `updateAllocationWithRepairCallback_${Date.now()}`
    window[callbackFuncName] = callback
  }
  const goWasm = await getWasm({ domain, wallet })
  try {
    const txnHash = await goWasm.sdk.updateAllocationWithRepair(
      allocationId,
      size,
      extend,
      lock,
      addBlobberId,
      addBlobberAuthTicket,
      removeBlobberId,
      ownerSigningPublicKey,
      updateAllocTicket,
      callbackFuncName
    )
    return txnHash
  } catch (e) {
    throw errorOut('updateAllocationWithRepair', e)
  } finally {
    // TODO: check if this is to be avoided or not
    delete window[callbackFuncName]
  }
}

/** getAllocationMinLock retrieves the minimum lock value for the allocation creation
 *
 * Lock value is the amount of tokens that the client needs to lock in the allocation's write pool to be able to pay for the write operations.
 *
 * @returns the minimum lock value (in SAS)
 */
export const getAllocationMinLock = async ({
  domain,
  wallet,
  dataShards,
  parityShards,
  size,
  maxWritePrice,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Number of data shards */
  dataShards: number
  /** Number of parity shards */
  parityShards: number
  /** Size of the allocation in bytes */
  size: number
  /** Maximum write price set by the client */
  maxWritePrice: number
}): Promise<number> => {
  const goWasm = await getWasm({ domain, wallet })
  const minLockDemand = await goWasm.sdk.getAllocationMinLock(
    dataShards,
    parityShards,
    size,
    maxWritePrice
  )
  return minLockDemand
}

/**
 * getUpdateAllocationMinLock retrieves the minimum lock value for the allocation after update, as calculated by the network based on the update parameters.
 *
 * Lock value is the amount of tokens that the client needs to lock in the allocation's write pool to be able to pay for the write operations.
 *
 * @returns the minimum lock value
 */
export const getUpdateAllocationMinLock = async ({
  domain,
  wallet,
  allocationId,
  size,
  extend,
  addBlobberId,
  removeBlobberId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Allocation ID to update */
  allocationId: string
  /** New size of the allocation in bytes */
  size: number
  /** Extend flag, whether to extend the allocation's expiration date */
  extend: boolean
  /** Blobber ID to add to the allocation */
  addBlobberId: string
  /** Blobber ID to remove from the allocation */
  removeBlobberId: string
}): Promise<number> => {
  const goWasm = await getWasm({ domain, wallet })
  const minLockDemand = await goWasm.sdk.getUpdateAllocationMinLock(
    allocationId,
    size,
    extend,
    addBlobberId,
    removeBlobberId
  )
  return minLockDemand
}

/**
 * getAllocationWith retrieves the information of a free or a shared allocation given the auth ticket.
 * - **Free allocation** is an allocation that is created to the user using Vult app for the first time with no fees.
 * - **Shared allocation** is an allocation that has some shared files. The user who needs to access those files first needs to read the information of this allocation using an auth ticket.
 */
export const getAllocationWith = async ({
  domain,
  wallet,
  authTicket,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Auth ticket, used by a non-owner to access a shared allocation */
  authTicket: string
}): Promise<Allocation> => {
  const goWasm = await getWasm({ domain, wallet })
  return await goWasm.sdk.getAllocationWith(authTicket)
}

/** createFreeAllocation creates a free allocation */
export const createFreeAllocation = async ({
  domain,
  wallet,
  freeStorageMarker,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  // TODO
  freeStorageMarker: string
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.createfreeallocation(freeStorageMarker)
  return txnHash
}

/**
 * This method is used to sign updateAllocAuthTicket. This ticket is needed to allow someone else to run update transaction for your allocation on your terms.
 */
export const getUpdateAllocTicket = async ({
  domain,
  wallet,
  allocationId,
  userId,
  operationType,
  roundExpiry,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  // get from zcnContracts
  userId: string
  operationType: string
  roundExpiry: number
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const ticket = await goWasm.sdk.getUpdateAllocTicket(
    allocationId,
    userId,
    operationType,
    roundExpiry
  )
  return ticket
}

// ----------------------------------------
// Rewards sdk methods
// ----------------------------------------

/**
 * CollectRewards collect all rewards which are available for delegate & provider pair. (txn: `storagesc.collect_reward`)
 *
 * @returns the hash of the transaction
 */
export const collectRewards = async ({
  domain,
  wallet,
  providerType,
  providerId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  providerType: ProviderType
  providerId: string
}): Promise<string> => {
  const providerTypeId = getProviderTypeId(providerType)
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.collectRewards(providerTypeId, providerId)
  return txnHash
}

// ----------------------------------------
// Stakepool & Writepool sdk methods
// ----------------------------------------

/** getSkatePoolInfo is to get information about the stake pool for the allocation */
export const getStakePoolInfo = async ({
  domain,
  wallet,
  providerType,
  providerId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  providerType: ProviderType
  providerId: string
}): Promise<StakePoolInfo> => {
  const providerTypeId = getProviderTypeId(providerType)
  const goWasm = await getWasm({ domain, wallet })
  const info = await goWasm.sdk.getSkatePoolInfo(providerTypeId, providerId)
  return info
}

/**
 * Stake number of tokens for a given provider given its type and id
 * @returns the hash of the transaction
 */
export const lockStakePool = async ({
  domain,
  wallet,
  providerType,
  tokens,
  fee,
  providerId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  providerType: ProviderType
  /** Number of tokens to lock (in SAS) */
  tokens: number
  /** Transaction fee (in SAS) */
  fee: number
  providerId: string
}): Promise<string> => {
  const providerTypeId = getProviderTypeId(providerType)
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.lockStakePool(
    providerTypeId,
    tokens,
    fee,
    providerId
  )
  return txnHash
}

/**
 * unlockStakePool unlocks the write pool
 * @returns the hash of the transaction
 */
export const unlockStakePool = async ({
  domain,
  wallet,
  providerType,
  fee,
  providerId,
  clientId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  providerType: ProviderType
  /** Transaction fee (in SAS) */
  fee: number
  providerId: string
  /** Wallet ID */
  clientId: string
}): Promise<string> => {
  const providerTypeId = getProviderTypeId(providerType)
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.unlockStakePool(
    providerTypeId,
    fee,
    providerId,
    clientId
  )
  return txnHash
}

/**
 * lockWritePool locks given number of tokes for given duration in write pool
 * @returns the hash of the transaction
 */
export const lockWritePool = async ({
  domain,
  wallet,
  allocationId,
  tokens,
  fee,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** Number of tokens to lock (in SAS) */
  tokens: number
  /** Transaction fee (in SAS) */
  fee: number
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  const txnHash = await goWasm.sdk.lockWritePool(allocationId, tokens, fee)
  return txnHash
}

// ----------------------------------------
// Other sdk methods
// ----------------------------------------

type AuthToken = {
  recipient_public_key: string
  marker: string
  tokens: number
}
/** decodeAuthTicket decodes the auth ticket and returns the recipient public key and the tokens */
export const decodeAuthTicket = async ({
  domain,
  wallet,
  authTicket,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  authTicket: string
}): Promise<AuthToken> => {
  const goWasm = await getWasm({ domain, wallet })
  const resp = await goWasm.sdk.decodeAuthTicket(authTicket)
  return resp
}

/**
 * Issues the repair process for an allocation, starting from a specific path.
 *
 * Repair synchronizes the user's data within the allocation across all blobbers and restores any missing data on blobbers where it is incomplete.
 */
export const allocationRepair = async ({
  domain,
  wallet,
  allocationId,
  remotePath,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  remotePath: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.allocationRepair(allocationId, remotePath)
}

/**
 * repairSize retrieves the repair size for a specific path in an allocation
 *
 * Repair size is the size of the data that needs to be repaired in the allocation.
 */
export const repairSize = async ({
  domain,
  wallet,
  allocationId,
  remotePath,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  remotePath: string
}): Promise<{ upload_size: number; download_size: number }> => {
  const goWasm = await getWasm({ domain, wallet })
  const resp = await goWasm.sdk.repairSize(allocationId, remotePath)
  return resp
}
