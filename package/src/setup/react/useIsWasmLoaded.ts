import { atom, useAtom } from 'jotai'

export const isWasmLoadedAtom = atom(false)

export const useIsWasmLoaded = () => {
  const [isLoaded] = useAtom(isWasmLoadedAtom)

  return isLoaded
}
