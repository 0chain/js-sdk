export const getBls = async () => {
  const bls = window.bls
  if (!bls?.mod?.calledRun) await bls?.init(bls.BN254)
  return bls
}
