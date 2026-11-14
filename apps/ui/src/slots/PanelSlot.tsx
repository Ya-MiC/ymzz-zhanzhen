import React from 'react'

export default function PanelSlot() {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold mb-4">星雲脈絡</h2>
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 h-96 flex items-center justify-center">
        <span className="text-slate-400 text-sm">星雲圖（d3-force + Canvas）渲染區</span>
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase">匹配開關</h3>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" defaultChecked className="rounded accent-slate-600" />
          是否根據這些開關去找 AI 之前輸出的東西和思維鏈條 (Thinking Trace)
        </label>
      </div>
    </div>
  )
}
