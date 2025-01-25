import { atom, useAtomValue } from 'jotai'

export const isWasmLoadedAtom = atom(false)

export const useIsWasmLoaded = () => useAtomValue(isWasmLoadedAtom)
