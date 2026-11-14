import React from 'react'

export default function NavSlot() {
  return (
    <nav className="p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">導航</h2>
        <ul className="space-y-1">
          <li><a href="#" className="block px-3 py-2 rounded bg-slate-50 text-slate-700">項目</a></li>
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">我的思路</a></li>
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">我的工作區</a></li>
        </ul>
      </div>
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">插件</h2>
        <ul className="space-y-1">
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">ymzz-nav</a></li>
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">ymzz-stream</a></li>
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">ymzz-nebula</a></li>
        </ul>
      </div>
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">自動化任務</h2>
        <ul className="space-y-1">
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">定時導入</a></li>
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">每晚重算評分</a></li>
          <li><a href="#" className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-600">每晚完整性校驗</a></li>
        </ul>
      </div>
    </nav>
  )
}
