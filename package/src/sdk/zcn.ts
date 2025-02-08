import { getWasm } from '@/setup/wasm'
import type { NetworkDomain } from '@/types/wallet'

type TokenSymbol = 'zcn' | (string & {})
export const getUSDRate = async ({
  domain,
  symbol = 'zcn',
}: {
  domain: NetworkDomain
  symbol?: TokenSymbol
}): Promise<number> => {
  const goWasm = await getWasm({ domain })
  return await goWasm.sdk.getUSDRate(symbol)
}

type Balance = {
  zcn: number
  usd: number
  nonce: number
}
/** getWalletBalance retrieves the wallet balance of the client from the network */
export const getWalletBalance = async ({
  domain,
  clientId,
}: {
  domain: NetworkDomain
  /** Wallet ID */
  clientId: string
}): Promise<Balance> => {
  const goWasm = await getWasm({ domain })
  const balance = await goWasm.sdk.getWalletBalance(clientId)
  return balance
}
