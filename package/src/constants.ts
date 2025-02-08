import type { NetworkConfig, NetworkDomain } from '@/types/wallet'

export const networkConfig: NetworkConfig = {
  chainId: '0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe',
  signatureScheme: 'bls0chain',
  minConfirmation: 10,
  minSubmit: 20,
  confirmationChainLength: 3,
}

export const getZcnContracts = (
  domain: NetworkDomain
): {
  faucetSCAddress: string
  storageSCAddress: string
  minerSCAddress: string
  interestPoolSCAddress: string
  dexMintAddress: string
  teamWallet: string
} => {
  return {
    faucetSCAddress:
      '6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d3',
    storageSCAddress:
      '6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d7',
    minerSCAddress:
      '6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d9',
    interestPoolSCAddress:
      'cf8d0df9bd8cc637a4ff4e792ffe3686da6220c45f0e1103baa609f3f1751ef4',
    dexMintAddress:
      '6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712e0',
    teamWallet:
      domain === 'mainnet.zus.network'
        ? 'a4e6999add55dd7ac050904d2af2d248dd3329cdde953021bfa9ed9ef677f942'
        : '65b32a635cffb6b6f3c73f09da617c29569a5f690662b5be57ed0d994f234335',
  }
}
