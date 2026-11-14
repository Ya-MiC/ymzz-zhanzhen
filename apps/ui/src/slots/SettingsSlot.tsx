import React from 'react'

export default function SettingsSlot() {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold mb-4">設置</h2>
      <div className="border border-slate-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">主題（八套微明度對比色階）</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { id: 'yun', name: '雲' },
            { id: 'tao', name: '陶' },
            { id: 'wu', name: '霧' },
            { id: 'lu', name: '露' },
            { id: 'xia', name: '霞' },
            { id: 'xi', name: '溪' },
            { id: 'chao', name: '潮' },
            { id: 'zhan', name: '湛' },
          ].map((t) => (
            <button key={t.id} className="px-3 py-2 rounded border border-slate-300 text-sm hover:bg-slate-100">
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-slate-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">色彩模式</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="radio" name="scheme" defaultChecked className="rounded accent-slate-600" />
            系統
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="radio" name="scheme" className="rounded accent-slate-600" />
            淺色
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="radio" name="scheme" className="rounded accent-slate-600" />
            深色
          </label>
        </div>
      </div>
    </div>
  )
}
