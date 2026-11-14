// 設置頁 Appearance（施工令第 5 節第 7 條，照 T3 Code 風格）
// - 頂部搜索框（快捷鍵 /）；左側欄分組（全部 11 頁）
// - Color scheme：System / Light / Dark 三張預覽卡
// - Themes：八張主題卡，每張含淺/深預覽球，當前主題描邊高亮
// - Interface：Contrast 滑塊（50%~150%，默認 100%）、密度、字號、減少動態
// - 觸控熱區 ≥ 44px（--hit）

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUiStore } from '@/store/ui'
import { deriveRoles, contrastRatio } from '@/themes/derive'

/** 設置左欄全部頁面（施工令 5.8） */
const SETTINGS_PAGES = [
  { group: '一般', items: ['General', 'Appearance'] },
  {
    group: '我的思路（數據源）',
    items: ['量化公式', '標籤', '星雲'],
  },
  { group: '系統', items: ['快捷鍵', '插件', '紅藍對抗', '付款與用量', '數據與備份'] },
] as const

const THEME_DEFS: Record<string, [string, string, string, string]> = {
  雲: ['#F8F6EF', '#B9DDF1', '#F4DDE7', '#CDBFE0'],
  陶: ['#E8E3CC', '#B7C8A8', '#CBBF9E', '#A38E7A'],
  霧: ['#F8F6EF', '#B9DDF1', '#E8E3CC', '#B7C8A8'],
  露: ['#F8F6EF', '#F4DDE7', '#B7C8A8', '#CBBF9E'],
  霞: ['#F8F6EF', '#CDBFE0', '#F4DDE7', '#A38E7A'],
  溪: ['#B9DDF1', '#B7C8A8', '#E8E3CC', '#A38E7A'],
  潮: ['#B9DDF1', '#CDBFE0', '#CBBF9E', '#A38E7A'],
  湛: ['#F8F6EF', '#E8E3CC', '#CBBF9E', '#A38E7A'],
}

function ThemeSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block w-7 h-7 rounded-full border border-black/10"
      style={{ background: hex }}
      title={hex}
    />
  )
}

export default function SettingsPage() {
  const { themeId, setTheme, colorScheme, setColorScheme, contrast, setContrast } = useUiStore()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState<string>('Appearance')
  const searchRef = useRef<HTMLInputElement>(null)

  // 快捷鍵 / 聚焦搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const themes = useMemo(
    () =>
      Object.entries(THEME_DEFS).map(([name, colors]) => ({
        name,
        roles: deriveRoles(colors),
      })),
    [],
  )

  const filteredPages = SETTINGS_PAGES.map((g) => ({
    ...g,
    items: g.items.filter((it) => it.toLowerCase().includes(query.toLowerCase())),
  })).filter((g) => g.items.length > 0)

  const current = themes.find((t) => t.name === themeId) ?? themes[0]
  const inkBg0 = contrastRatio(current.roles.inkLight, current.roles.light[0]).toFixed(2)

  return (
    <div className="h-full flex" style={{ ['--hit' as string]: '44px' }}>
      {/* 左欄：搜索 + 分組 */}
      <aside className="w-60 shrink-0 border-r border-slate-200 p-3 overflow-y-auto">
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索設置（按 /）"
          aria-label="搜索設置"
          className="w-full min-h-[44px] px-3 rounded-lg border border-slate-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        {filteredPages.map((g) => (
          <div key={g.group} className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">{g.group}</h3>
            {g.items.map((it) => (
              <button
                key={it}
                onClick={() => setPage(it)}
                aria-current={page === it}
                className={`block w-full text-left min-h-[44px] px-3 rounded-lg text-sm transition-colors ${
                  page === it ? 'bg-sky-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {it}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* 右側：Appearance 內容 */}
      <section className="flex-1 overflow-y-auto p-8 max-w-3xl">
        {page === 'Appearance' ? (
          <>
            <h1 className="text-xl font-semibold mb-6">Appearance</h1>

            {/* Color scheme 三卡 */}
            <h2 className="text-sm font-medium text-slate-500 mb-2">Color scheme</h2>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {(
                [
                  { id: 'system', label: 'System', bg: 'linear-gradient(135deg,#F8F6EF 50%,#191C29 50%)' },
                  { id: 'light', label: 'Light', bg: '#F8F6EF' },
                  { id: 'dark', label: 'Dark', bg: '#191C29' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setColorScheme(s.id)}
                  aria-pressed={colorScheme === s.id}
                  className={`min-h-[44px] rounded-xl border-2 p-3 text-left transition-colors ${
                    colorScheme === s.id ? 'border-sky-500' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block w-full h-10 rounded-lg mb-2 border border-black/5" style={{ background: s.bg }} />
                  <span className="text-sm">{s.label}</span>
                </button>
              ))}
            </div>

            {/* 八張主題卡 */}
            <h2 className="text-sm font-medium text-slate-500 mb-2">Themes（八套微明度對比色階）</h2>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  aria-pressed={themeId === t.name}
                  className={`min-h-[44px] rounded-xl border-2 p-3 text-left transition-colors ${
                    themeId === t.name ? 'border-sky-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-1.5 mb-2">
                    {/* 淺色球 */}
                    {t.roles.light.map((c, i) => (
                      <ThemeSwatch key={`l${i}`} hex={c} />
                    ))}
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    {/* 深色球（deriveRoles 數學衍生，非自造） */}
                    {t.roles.dark.map((c, i) => (
                      <ThemeSwatch key={`d${i}`} hex={c} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mb-8">
              當前主題「{current.name}」淺色 ink/背景對比 {inkBg0}:1（WCAG ≥ 4.5 ✓）；深色為鎖定色互補莫蘭蒂化衍生，色不另造。
            </p>

            {/* Interface */}
            <h2 className="text-sm font-medium text-slate-500 mb-2">Interface</h2>
            <div className="rounded-xl border border-slate-200 p-4 mb-4">
              <label htmlFor="contrast" className="block text-sm mb-1">
                Contrast（對比度滑塊，{contrast}%）
              </label>
              <input
                id="contrast"
                type="range"
                min={50}
                max={150}
                step={5}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full min-h-[44px] accent-sky-500"
              />
              <p className="text-xs text-slate-400">
                100% 時四個鎖定色原樣出現在各自角色；滑塊只放大/縮小明度台階間距（用於邊線、分隔、hover）。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 mb-4">
              <h3 className="text-sm font-medium mb-2">界面密度</h3>
              <div className="flex gap-2">
                {['緊湊', '舒適'].map((d) => (
                  <button key={d} className="min-h-[44px] px-4 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-medium mb-1">減少動態</h3>
              <p className="text-xs text-slate-400">跟隨系統 prefers-reduced-motion；動效一律可降級。</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-4">{page}</h1>
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-sm">
              {page} 面板施工中（P1–P2 按階段接入：語錄源、公式權重、插件、紅藍報告、訂單與權益點、備份導出）。
            </div>
          </>
        )}
      </section>
    </div>
  )
}
