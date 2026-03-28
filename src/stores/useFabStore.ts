import { create } from 'zustand'

interface FabStore {
  isOpen: boolean
  previousTabName: string
  open: () => void
  toggle: () => void
  close: () => void
  setPreviousTab: (name: string) => void
}

export const useFabStore = create<FabStore>((set) => ({
  isOpen: false,
  previousTabName: 'index',
  open: () => set({ isOpen: true }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
  setPreviousTab: (name) => set({ previousTabName: name }),
}))
