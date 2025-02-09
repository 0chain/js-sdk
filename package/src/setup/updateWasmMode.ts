import { resetGoWasm } from '@/setup/wasm'
import type { WasmType } from '@/types';

export const updateWasmMode = async (
  desiredAllocationType: WasmType
): Promise<void> => {
  resetGoWasm()

  if (desiredAllocationType === 'enterprise') {
    localStorage.setItem('enterpriseAlloc', 'enabled')
  } else localStorage.removeItem('enterpriseAlloc')
}
