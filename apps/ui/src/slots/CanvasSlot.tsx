import React from 'react'

export default function CanvasSlot() {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">語錄流</h2>
        <button className="px-3 py-1.5 rounded border border-slate-200 bg-slate-900 text-white text-sm hover:bg-slate-800">
          AI 注解（付費）
        </button>
      </div>
      <div className="space-y-3">
        {[
          { id: '1', text: '說出去的話就是潑出去的水，凡是水，皆在大自然的循環中往復。', source: '思考筆記', score: 78 },
          { id: '2', text: '用量化+標籤注解的方式，詮釋自己説過的東西。', source: 'AI 對話', score: 64 },
          { id: '3', text: '對自己的往往做注解，才能看見循環。', source: '日記', score: 82 },
        ].map((u) => (
          <div key={u.id} className="border border-slate-200 rounded-lg p-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-400 mt-2 shrink-0"></div>
            <div className="flex-1">
              <p className="text-slate-700 leading-relaxed">{u.text}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <span>{u.source}</span>
                <span>分數 {u.score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
