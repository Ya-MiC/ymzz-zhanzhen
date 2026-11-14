import { create } from 'zustand'

export interface UiState {
  themeId: string
  colorScheme: 'system' | 'light' | 'dark'
  contrast: number // 50~150, default 100
  sidebarCollapsed: boolean
  setTheme: (id: string) => void
  setColorScheme: (s: 'system' | 'light' | 'dark') => void
  setContrast: (v: number) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  themeId: 'yun',
  colorScheme: 'system',
  contrast: 100,
  sidebarCollapsed: false,
  setTheme: (id) => set({ themeId: id }),
  setColorScheme: (s) => set({ colorScheme: s }),
  setContrast: (v) => set({ contrast: Math.min(150, Math.max(50, v)) }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
