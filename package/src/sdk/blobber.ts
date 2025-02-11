// TODO: not used in webapps: deleteFile, multiDownload, multiUpload, downloadBlocks, updateBlobberSettings, getRemoteFileMap (deprecated), getContainers, updateContainer, searchContainer, repairAllocation, checkAllocStatus, createWorkers, getFileMetaByName, downloadDirectory.
// TODO: GoSDK methods related to "player" proxy are deprecated
import { errorOut } from '@/sdk/utils/misc'
import { getBridge, globalCtx } from '@/setup/createWasm/bridge'
import { readChunk } from '@/setup/createWasm/createProxy/sdkProxy'
import { getWasm } from '@/setup/wasm'
import type {
  Blobber,
  FileRefByName,
  GolangFileRefByName,
  ListResult,
} from '@/types/blobber'
import type { ActiveWallet, NetworkDomain, Transaction } from '@/types/wallet'

/** Deletes a file from an allocation. Only the owner of the allocation can delete a file.
 *
 * To perform multiple deletions in a single call, use the `multiOperation` method instead.
 */
export const deleteFile = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** remote path of the file to be deleted*/
  remotePath: string
}): Promise<{ commandSuccess: boolean; error: string }> => {
  const goWasm = await getWasm({ domain, wallet })
  try {
    const response = await goWasm.sdk.delete(allocationId, remotePath)

    if (response.error) throw new Error(response.error)

    return response
  } catch (e) {
    throw errorOut('deleteFile', e)
  }
}

/** Generates an `authTicket` that provides authorization to the holder to the specified file on the remotepath. */
export const share = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
  clientId = '',
  encryptionPublicKey = '',
  expiration = 0,
  revoke = false,
  availableAfter = '',
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** Remote path of the file to be shared */
  remotePath: string
  /** Client ID / wallet ID of the recipient (for public sharing) */
  clientId?: string
  /** Encryption public key of the recipient (for private sharing) */
  encryptionPublicKey?: string
  /**
   * Expiration time of the auth ticket (in Unix timestamp seconds. e.g. `1647858200`)
   * @default 0 (no expiration)
   */
  expiration?: number
  /** Whether to revoke the share. Only applicable for private sharing */
  revoke?: boolean
  /** Time after which the share becomes available */
  availableAfter?: string
}): Promise<string> => {
  const goWasm = await getWasm({ domain, wallet })
  try {
    const authTicket = await goWasm.sdk.share(
      allocationId,
      remotePath,
      clientId,
      encryptionPublicKey,
      expiration,
      revoke,
      availableAfter
    )
    if (!authTicket) throw new Error('authTicket is undefined')

    return authTicket
  } catch (e) {
    throw errorOut('shareFile', e)
  }
}

/** Options for a single file download, usually as part of a multi-download request. */
type MultiDownloadOption = {
  /** Remote path of the file to be downloaded */
  remotePath: string
  /** Local path where the file should be stored (optional) */
  localPath?: string
  /** Download operation type */
  downloadType: 'file' | 'thumbnail'
  /** Number of blocks to download per request @default 100 */
  numBlocks?: number
  /** @optional Required only for file download with an auth ticket */
  remoteFileName: string
  /** @optional Lookup hash for remote file, required for auth ticket downloads */
  remoteLookupHash?: string
  /** Whether to download the file directly to disk - This uses FileSytem API. This is not supported on Safari browser. Check: https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker */
  downloadToDisk: boolean
  /** Suggested name for the file when downloading to disk (optional) */
  suggestedName?: string
}

/** Response format for each downloaded file in a multi-download operation */
type DownloadCommandResponse = {
  commandSuccess: boolean
  error?: string
  /** Name of the downloaded file */
  fileName?: string
  /** Blob URL of the downloaded file */
  url?: string
}

/** Downloads multiple files in parallel in a batch. This method supports downloading files directly to disk (if supported by the browser) and provides progress updates via a callback function. */
export const multiDownload = async ({
  wallet,
  domain,
  allocationId,
  multiDownloadOptions,
  authTicket = '',
  callback,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** @optional Required only for download of a shared files (non-owner) */
  authTicket?: string
  /** Array of download options for each file */
  multiDownloadOptions: MultiDownloadOption[]
  /** Callback function will be invoked with progress updates */
  callback?: (
    totalBytes: number,
    completedBytes: number,
    fileName: string,
    blobURL: string,
    error?: string
  ) => void
}): Promise<DownloadCommandResponse[]> => {
  const multiDlOptions = multiDownloadOptions.map(option => {
    let downloadToDisk = option.downloadToDisk
    if (downloadToDisk) {
      const isSupported = 'showSaveFilePicker' in window // ref https://0chain.slack.com/archives/C05JA2A662X/p1704447229385239?thread_ts=1704223167.599399&cid=C05JA2A662X
      downloadToDisk = isSupported
    }
    return {
      ...option,
      numBlocks: option.numBlocks || 100,
      downloadOp: option.downloadType === 'file' ? 1 : 2,
      downloadToDisk,
    }
  })
  const goWasm = await getWasm({ domain, wallet })

  let callbackFuncName = ''
  if (callback) {
    callbackFuncName = `multiDownloadCallback_${Date.now()}`
    window[callbackFuncName] = callback
  }
  try {
    const jsonData = (await goWasm.sdk.multiDownload(
      allocationId,
      JSON.stringify(multiDlOptions),
      authTicket,
      callbackFuncName
    )) as string

    const response = JSON.parse(jsonData)

    return response
  } catch (e) {
    throw errorOut('multiDownload', e)
  } finally {
    // TODO: check if this is to be avoided or not
    if (callbackFuncName) delete window[callbackFuncName]
  }
}

/** Sets the upload mode for modifying the upload speed and CPU usage . Possible upload modes:
 *  - 0 = Slow uploads (Consumes less CPU & Memory)
 *  - 1 = Standard (Default)
 *  - 2 = High Speed uploads (Consumes more CPU & Memory)
 */
export const setUploadMode = async ({
  wallet,
  domain,
  mode = 1,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Upload mode:
   *  - 0 = low
   *  - 1 = medium (default)
   *  - 2 = high */
  mode: 0 | 1 | 2
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.setUploadMode(mode)
}

type BulkUploadOption = {
  allocationId: string
  webstreaming: boolean
  isUpdate: boolean
  isRepair: boolean
  /** Number of blocks to upload per request @default 100 */
  numBlocks: number
  file: File
  remotePath: string
  /** Whether to encrypt the file */
  encrypt: boolean
  thumbnailBytes: number[]
  /** Callback function will be invoked with progress updates */
  callback?: (
    totalBytes: number,
    completedBytes: number,
    fileName: string,
    blobURL: string,
    error: string
  ) => void
  /** @optional */
  uploadId?: string
  /** @deprecated */
  webStreaming?: boolean
}

const sdkMultiUpload = async ({
  wallet,
  domain,
  bulkUploadOptions,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  bulkUploadOptions: BulkUploadOption[]
}): Promise<{ success?: boolean; error?: string }> => {
  const goWasm = await getWasm({ domain, wallet })
  try {
    const jsonOptions = JSON.stringify(bulkUploadOptions)
    const result = await goWasm.sdk.multiUpload(jsonOptions)
    if (result.error) throw new Error(result.error)

    return result
  } catch (e) {
    throw errorOut('multiUpload', e)
  }
}

/** Upload multiple files in a batch. Also, used to resume a paused upload.
 *
 *  NOTE: Keep the batch size under 50 files. */
export const multiUpload = async ({
  wallet,
  domain,
  bulkUploadOptions: options,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  bulkUploadOptions: BulkUploadOption[]
}): Promise<{ success?: boolean; error?: string }> => {
  const g = globalCtx()
  const bridge = getBridge()
  const start = bridge.glob.index
  const opts = options.map(obj => {
    const i = bridge.glob.index
    bridge.glob.index++
    const readChunkFuncName = '__zcn_upload_reader_' + i.toString()
    const callbackFuncName = '__zcn_upload_callback_' + i.toString()
    g[readChunkFuncName] = async (offset: number, chunkSize: number) => {
      const chunk = await readChunk(offset, chunkSize, obj.file)
      return chunk.buffer
    }

    const callback = obj.callback
    if (callback) {
      g[callbackFuncName] = async (
        totalBytes: number,
        completedBytes: number,
        fileName: string,
        blobUrl: string,
        error: string
      ) => callback(totalBytes, completedBytes, fileName, blobUrl, error)
    }
    delete obj.uploadId
    return {
      ...obj,
      fileSize: obj.file.size,
      readChunkFuncName,
      callbackFuncName,
    }
  })

  const end = bridge.glob.index

  const result = await sdkMultiUpload({
    wallet,
    domain,
    bulkUploadOptions: opts,
  })

  for (let i = start; i < end; i++) {
    g['__zcn_upload_reader_' + i.toString()] = null
    g['__zcn_upload_callback_' + i.toString()] = null
  }
  return result
}

type MultiOperationOption = {
  /** Type of operation: 'copy', 'move', 'delete', or 'createdir' */
  operationType: 'copy' | 'move' | 'delete' | 'createdir'
  /** Remote path of the file/directory */
  remotePath: string
  /** Destination name (only for rename operation) */
  destName?: string
  /** Destination path (required for copy and move operations) */
  destPath?: string
}

/** Perform multiple operations (copy, move, delete, create directory) together */
export const multiOperation = async ({
  wallet,
  domain,
  allocationId,
  operations,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  operations: MultiOperationOption[]
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  try {
    const jsonOptions = JSON.stringify(operations)
    const errorMessage = (await goWasm.sdk.multiOperation(
      allocationId,
      jsonOptions
    )) as string

    if (errorMessage) throw new Error(errorMessage)
  } catch (e) {
    throw errorOut('multiOperation', e)
  }
}

/** List the files for a given allocation ID and remote path */
export const listObjects = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
  offset = 0,
  pageLimit = -1,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** The remote path of the file */
  remotePath: string
  /** The pagination offset for the list. @default 0 (turn off pagination)*/
  offset: number
  /** The number of items per page. @default -1 (turn off pagination) */
  pageLimit: number
}): Promise<ListResult> => {
  const goWasm = await getWasm({ domain, wallet })

  const listResult = await goWasm.sdk.listObjects(
    allocationId,
    remotePath,
    offset,
    pageLimit
  )

  return listResult
}

/** List objects from an auth ticket. It's useful for accessing a shared source by a non-owner */
export const listObjectsFromAuthTicket = async ({
  wallet,
  domain,
  allocationId,
  authTicket,
  lookupHash,
  offset = 0,
  pageLimit = -1,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** The auth ticket, provided by a non-owner to access a shared source */
  authTicket: string
  /** The lookup hash for the file */
  lookupHash: string
  /** The pagination offset for the list. @default 0 (turn off pagination)*/
  offset: number
  /** The number of items per page. @default -1 (turn off pagination) */
  pageLimit: number
}): Promise<ListResult> => {
  const goWasm = await getWasm({ domain, wallet })
  const listResult = await goWasm.sdk.listObjectsFromAuthTicket(
    allocationId,
    authTicket,
    lookupHash,
    offset,
    pageLimit
  )
  return listResult
}

// TODO: listSharedFiles

/** Create a directory on blobbers */
export const createDir = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** The remote path where the directory will be created */
  remotePath: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.createDir(allocationId, remotePath)
}

/** Downloads a specified range of blocks from a file. */
export const downloadBlocks = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
  authTicket = '',
  lookupHash,
  writeChunkFunc,
  startBlock,
  endBlock,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  remotePath: string
  /** @optional Required only for download of a shared file (non-owner) */
  authTicket?: string
  /** Lookup hash of the file, which is used to locate the file if remotepath and allocation id are not provided */
  lookupHash?: string
  writeChunkFunc: (
    lookupHash: string,
    chunk: Uint8Array,
    offset: number
  ) => void
  startBlock: number
  endBlock: number
}): Promise<Uint8Array> => {
  const goWasm = await getWasm({ domain, wallet })

  let writeChunkFuncName = ''
  if (writeChunkFunc) {
    writeChunkFuncName = `multiDownloadCallback_${Date.now()}`
    window[writeChunkFuncName] = writeChunkFunc
  }
  try {
    const data = await goWasm.sdk.downloadBlocks(
      allocationId,
      remotePath,
      authTicket,
      lookupHash,
      writeChunkFuncName,
      startBlock,
      endBlock
    )

    return data
  } catch (e) {
    throw errorOut('downloadBlocks', e)
  } finally {
    // TODO: check if this is to be avoided or not
    if (writeChunkFuncName) delete window[writeChunkFuncName]
  }
}

type FileStats = {
  CreatedAt: string
  blobber_id: string
  blobber_url: string
  blockchain_aware: boolean
  file_id: string
  last_challenge_txn: string
  name: string
  num_of_block_downloads: number
  num_of_blocks: number
  num_of_challenges: number
  num_of_failed_challenges: number
  num_of_updates: number
  path: string
  path_hash: string
  size: number
  write_marker_txn: string
}

/** Fetches the file details */
export const getFileStats = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  remotePath: string
}): Promise<FileStats[]> => {
  const goWasm = await getWasm({ domain, wallet })
  const fileStats = await goWasm.sdk.getFileStats(allocationId, remotePath)
  return fileStats
}

// TODO: improve docs details
/** Updates the settings for a blobber. */
export const updateBlobberSettings = async ({
  wallet,
  domain,
  blobberSettings,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** The new settings to apply to the blobber */
  blobberSettings: Blobber
}): Promise<Transaction> => {
  const goWasm = await getWasm({ domain, wallet })

  try {
    const blobberSettingsJson = JSON.stringify(blobberSettings)

    const transaction = await goWasm.sdk.updateBlobberSettings(
      blobberSettingsJson
    )

    return transaction
  } catch (e) {
    throw errorOut('updateBlobberSettings', e)
  }
}

type FileInfo = {
  actual_size: number
  created_at: string
  encrypted_key: string
  hash: string
  lookup_hash: string
  mimetype: string
  size: number
  type: string
  updated_at: string
  name: string
  path: string
}

/** Lists all files in an allocation from the blobbers.
 * @deprecated This will consume too much memory and time if there are many nested folders with many files. Prefer using `listObjects` instead.
 */
export const getRemoteFileMap = async ({
  wallet,
  domain,
  allocationId,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
}): Promise<FileInfo[]> => {
  const goWasm = await getWasm({ domain, wallet })

  return await goWasm.sdk.getRemoteFileMap(allocationId)
}

/** Get list of active blobbers */
export const getBlobbers = async ({
  wallet,
  domain,
  stakable,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** flag to get only stakable blobbers */
  stakable: boolean
}): Promise<Blobber[]> => {
  const goWasm = await getWasm({ domain, wallet })
  return await goWasm.sdk.getBlobbers(stakable)
}

/** Retrieves blobber IDs for the given list of blobber URLs. */
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

/**
 * GetContainers returns all the running containers in a given domain exposing the `{requestDomain}/endpoints/{endpointID}/docker/containers/json` endpoint
 *
 * The request should be authenticated with the given username and password, by first creating an auth token then issuing the request.
 *
 * @returns List of containers
 */
export const getContainers = async ({
  wallet,
  domain,
  username,
  password,
  requestDomain,
}: {
  wallet: ActiveWallet
  domain: NetworkDomain
  /** Username to authenticate with */
  username: string
  /** Password to authenticate with */
  password: string
  /** Domain to issue the request to */
  requestDomain: string
}): Promise<Array<Record<string, any>>> => {
  const goWasm = await getWasm({ domain, wallet })

  const containers = await goWasm.sdk.getcontainers(
    username,
    password,
    requestDomain
  )
  return containers
}

/**
 * UpdateContainer updates the given container ID with a new image ID in a given domain.
 * The domain should expose the docker API endpoints under `{requestDomain}/endpoints/{endpointID}/docker`.
 * The request should be authenticated with the given username and password, by first creating an auth token then issuing the request.
 *
 * @returns A map containing the response from the update operation.
 */
export const updateContainer = async ({
  wallet,
  domain,
  username,
  password,
  containerID,
  newImageID,
  requestDomain,
}: {
  wallet: ActiveWallet
  domain: NetworkDomain
  /** Username to authenticate with */
  username: string
  /** Password to authenticate with */
  password: string
  /** Domain to issue the request to */
  requestDomain: string
  /** Container ID to update */
  containerID: string
  /** New Image ID to update the container with */
  newImageID: string
}): Promise<Record<string, any>> => {
  const goWasm = await getWasm({ domain, wallet })

  const response = await goWasm.sdk.updatecontainer(
    username,
    password,
    requestDomain,
    containerID,
    newImageID
  )
  return response
}

/**
 * searchContainer searches for a container with a given name in a given domain exposing the `{requestDomain}/endpoints/{endpointID}/docker/containers/json` endpoint.
 * The request should be authenticated with the given username and password, by first creating an auth token then issuing the request.
 * The response is a list of containers in JSON format that match the given name.
 *
 * @returns List of containers matching the name
 */
export const searchContainer = async ({
  wallet,
  domain,
  username,
  password,
  name,
  requestDomain,
}: {
  wallet: ActiveWallet
  domain: NetworkDomain
  /** Username to authenticate with */
  username: string
  /** Password to authenticate with */
  password: string
  /** Domain to issue the request to */
  requestDomain: string
  /** Name of the container to search for */
  name: string
}): Promise<Array<Record<string, any>>> => {
  const goWasm = await getWasm({ domain, wallet })

  const containers = await goWasm.sdk.searchcontainer(
    username,
    password,
    requestDomain,
    name
  )
  return containers
}

/** Cancel the upload operation of the file. */
export const cancelUpload = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
}: {
  wallet: ActiveWallet
  domain: NetworkDomain
  allocationId: string
  /** Remote path of the file */
  remotePath: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return await goWasm.sdk.cancelUpload(allocationId, remotePath)
}

/** Pause the upload operation of the file. */
export const pauseUpload = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
}: {
  wallet: ActiveWallet
  domain: NetworkDomain
  allocationId: string
  /** Remote path of the file */
  remotePath: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return await goWasm.sdk.pauseUpload(allocationId, remotePath)
}

/** Get file metadata by name. (File Search) */
export const getFileMetaByName = async <T extends FileRefByName>({
  wallet,
  domain,
  allocationId,
  fileName,
  modifyFileRef,
}: {
  wallet: ActiveWallet
  domain: NetworkDomain
  allocationId: string
  fileName: string
  modifyFileRef?: (file: FileRefByName) => T
}): Promise<T[] | FileRefByName[]> => {
  const goWasm = await getWasm({ domain, wallet })

  try {
    const golangObjectResponse = (await goWasm.sdk.getFileMetaByName(
      allocationId,
      fileName
    )) as GolangFileRefByName[]

    const covertGolangToJSFileRefByName = <T extends FileRefByName>(
      fileRefs: GolangFileRefByName[],
      modifyFileRef?: (file: FileRefByName) => T
    ): T[] | FileRefByName[] => {
      return fileRefs.flatMap(fileRef => {
        const file: FileRefByName = {
          name: fileRef.Name,
          type: fileRef.Type,
          path: fileRef.Path,
          lookup_hash: fileRef.LookupHash,
          hash: fileRef.Hash,
          mimetype: fileRef.MimeType,
          size: fileRef.Size,
          num_blocks: fileRef.NumBlocks,
          actual_size: fileRef.ActualFileSize,
          actual_num_blocks: fileRef.ActualNumBlocks,
          encryption_key: fileRef.EncryptedKey,
          file_meta_hash: fileRef.FileMetaHash,
          thumbnail_hash: fileRef.ThumbnailHash,
          actual_thumbnail_size: fileRef.ActualThumbnailSize,
          actual_thumbnail_hash: fileRef.ActualThumbnailHash,
          collaborators: fileRef.Collaborators,
          created_at: fileRef.CreatedAt,
          updated_at: fileRef.UpdatedAt,
          fromSearch: true,
        }

        if (modifyFileRef) {
          const customFile = modifyFileRef(file)
          return customFile ? [customFile] : []
        }

        return [file]
      })
    }

    const jsObjectResponse = covertGolangToJSFileRefByName(
      golangObjectResponse,
      modifyFileRef
    )

    return jsObjectResponse
  } catch (e) {
    throw errorOut('getFileMetaByName', e)
  }
}

/**  Download files in a directory recursively. */
export const downloadDirectory = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
  authTicket = '',
  callback,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  allocationId: string
  /** @optional Required only for download of a shared directory (non-owner) */
  authTicket?: string
  /** Remote path of the directory to download */
  remotePath: string
  /** Callback function will be invoked with progress updates */
  callback?: (
    totalBytes: number,
    completedBytes: number,
    fileName: string,
    blobURL: string,
    error?: string
  ) => void
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })

  let callbackFuncName = ''
  if (callback) {
    callbackFuncName = `downloadDirectoryCallback_${Date.now()}`
    window[callbackFuncName] = callback
  }

  try {
    await goWasm.sdk.downloadDirectory(
      allocationId,
      remotePath,
      authTicket,
      callbackFuncName
    )
  } catch (e) {
    throw errorOut('downloadDirectory', e)
  } finally {
    // TODO: check if this is to be avoided or not
    if (callbackFuncName) delete window[callbackFuncName]
  }
}

/** Cancel the download of a directory. */
export const cancelDownloadDirectory = async ({
  wallet,
  domain,
  remotePath,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** Remote path of the directory */
  remotePath: string
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.cancelDownloadDirectory(remotePath)
}

/** Cancels the download of a specified range of blocks from a file. */
export const cancelDownloadBlocks = async ({
  wallet,
  domain,
  allocationId,
  remotePath,
  start,
  end,
}: {
  domain: NetworkDomain
  wallet: ActiveWallet
  /** The allocation ID associated with the file */
  allocationId: string
  /** The remote path where the file is located */
  remotePath: string
  /** The start block previously used in the downloadBlocks call */
  start: number
  /** The endi block previously used in the downloadBlocks call */
  end: number
}): Promise<void> => {
  const goWasm = await getWasm({ domain, wallet })
  return goWasm.sdk.cancelDownloadBlocks(allocationId, remotePath, start, end)
}

/* 
 TODO: skipped upload. because we are passing fileBytes which can take up a lot of memory
 */
// type BulkUploadOption = {
//   remotePath: string
//   fileBytes: Uint8Array
//   thumbnailBytes?: Uint8Array
//   webStreaming?: boolean
//   encrypt?: boolean
//   isUpdate?: boolean
//   isRepair?: boolean
//   numBlocks?: number
// }
// export const upload = async ({
//   wallet,
//   domain,
//   allocationId,
//   remotePath,
//   fileBytes,
//   thumbnailBytes,
//   webStreaming = false,
//   encrypt,
//   isUpdate,
//   isRepair,
//   numBlocks,
// }: {
//   domain: NetworkDomain
//   wallet: ActiveWallet
//   allocationId: string
//   /** Remote path where the file should be stored */
//   remotePath: string
//   /** File data in bytes */
//   fileBytes: Uint8Array
//   /** Thumbnail data in string of byte numbers. For example: strings like `128,32,6,...` */
//   thumbnailBytes: string
//   /** @deprecated */
//   webStreaming: boolean
//   /** Enable encryption for the uploaded file */
//   encrypt: boolean
//   /** Whether this is an update operation */
//   isUpdate: boolean
//   /** Whether this is a repair operation */
//   isRepair: boolean
//   /** Number of blocks to upload */
//   numBlocks: number
// }) => {
//   const goWasm = await getWasm({ domain, wallet })
//   try {
//     const response = (await goWasm.sdk.upload(
//       allocationId,
//       remotePath,
//       fileBytes,
//       thumbnailBytes,
//       webStreaming,
//       encrypt,
//       isUpdate,
//       isRepair,
//       numBlocks
//     )) as {
//       /** Indicates whether the command was successful */
//       commandSuccess?: boolean
//       /** Error message if the operation failed */
//       error?: string
//     }
//     if (response.error) throw new Error(response.error)
//     return response
//   } catch (e) {
//     console.error('upload: ', e)
//     if (typeof e === 'string') throw new Error(e)
//     else if (e instanceof Error) throw e
//     else throw new Error(`upload: Unknown error`)
//   }
// }
