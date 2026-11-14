import React, { useState } from 'react'
import { useUiStore } from '@/store/ui'
import { themes, type ThemeId } from '@/themes/themes'
import NavSlot from '@/slots/NavSlot'
import CanvasSlot from '@/slots/CanvasSlot'
import PanelSlot from '@/slots/PanelSlot'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  const { themeId, colorScheme, sidebarCollapsed, toggleSidebar, setColorScheme } = useUiStore()
  const [view, setView] = useState<'main' | 'settings'>('main')

  const theme = themes.find((t) => t.id === themeId as ThemeId) ?? themes[0]

  // 根元素設定 data-* 以供 CSS 變數
  const rootClass = `palette-${themeId} mode-${colorScheme}`

  if (view === 'settings') {
    return (
      <div className={`h-screen bg-white text-slate-900 font-sans ${rootClass}`}>
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('main')} className="min-h-[44px] px-3 rounded hover:bg-slate-100 text-sm">
              ← 返回
            </button>
            <span className="font-semibold tracking-tight">設置</span>
          </div>
          <span className="text-xs text-slate-400">晏銘湛箴 · 無無即無</span>
        </header>
        <div className="h-[calc(100vh-4rem)]">
          <SettingsPage />
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen bg-white text-slate-900 font-sans ${rootClass}`}>
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 rounded hover:bg-slate-100">
            ☰
          </button>
          <span className="font-semibold tracking-tight">晏銘湛箴</span>
          <span className="text-xs text-slate-500">· Zhanzhen</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value as any)}
            className="rounded border border-slate-200 px-2 py-1 text-sm bg-white"
          >
            <option value="system">系統</option>
            <option value="light">淺色</option>
            <option value="dark">深色</option>
          </select>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左導航（可收起） */}
        {!sidebarCollapsed && (
          <aside className="w-64 border-r border-slate-200 bg-white shrink-0 flex flex-col">
            <NavSlot />
          </aside>
        )}

        {/* 中間主畫布 */}
        <main className="flex-1 min-w-0 bg-white overflow-hidden flex flex-col">
          <CanvasSlot />
        </main>

        {/* 右星雲面板 */}
        <aside className="w-80 border-l border-slate-200 bg-white shrink-0 flex flex-col">
          <PanelSlot />
        </aside>
      </div>

      {/* 底部：進入設置 */}
      <footer className="h-14 border-t border-slate-200 bg-white/80 flex items-center justify-end px-4 shrink-0">
        <button
          onClick={() => setView('settings')}
          className="min-h-[44px] px-4 rounded border border-slate-200 hover:bg-slate-50 text-sm"
        >
          設置
        </button>
      </footer>
    </div>
  )
}
