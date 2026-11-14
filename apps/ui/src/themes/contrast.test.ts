// 對比度驗收（施工令第 5 節第 6 條）：
// 遍歷 8 主題 × 淺/深 × {ink 對 bg-0/1/2}，WCAG ≥ 4.5:1。
// 不達標的組合不得發布；不自行改色，測試失敗即回報用戶。
// 另含「TS 移植 ↔ build_tokens.py 產物逐 hex 一致」的一致性測試。

import { describe, it, expect } from 'vitest'
import { contrastRatio, deriveRoles, toLch } from './derive'

// ---- 八套主題（每套 4 個鎖定色，取自 tokens.css，不改動）----
const THEMES: Record<string, [string, string, string, string]> = {
  雲: ['#F8F6EF', '#B9DDF1', '#F4DDE7', '#CDBFE0'], // 家族 A
  陶: ['#E8E3CC', '#B7C8A8', '#CBBF9E', '#A38E7A'], // 家族 B
  霧: ['#F8F6EF', '#B9DDF1', '#E8E3CC', '#B7C8A8'],
  露: ['#F8F6EF', '#F4DDE7', '#B7C8A8', '#CBBF9E'],
  霞: ['#F8F6EF', '#CDBFE0', '#F4DDE7', '#A38E7A'],
  溪: ['#B9DDF1', '#B7C8A8', '#E8E3CC', '#A38E7A'],
  潮: ['#B9DDF1', '#CDBFE0', '#CBBF9E', '#A38E7A'],
  湛: ['#F8F6EF', '#E8E3CC', '#CBBF9E', '#A38E7A'], // 呼應湛然常寂
}

// ---- tokens.css 地面真值（vendor/ymzz-wenrun-design-skill/tokens.css 逐字）----
const TOKENS = {
  A: {
    light: ['#F8F6EF', '#F4DDE7', '#B9DDF1', '#CDBFE0'],
    dark: ['#191C29', '#1E3029', '#4A3528', '#9FA98F'],
    ink: '#221F14',
    inkDark: '#E2E4ED',
  },
  B: {
    light: ['#E8E3CC', '#B7C8A8', '#CBBF9E', '#A38E7A'],
    dark: ['#1A1C29', '#31263A', '#333A4E', '#95A7B7'],
    ink: '#221F14',
    inkDark: '#E2E4ED',
  },
}

describe('derive.ts ↔ build_tokens.py 一致性', () => {
  it('家族 A（雲）淺色角色與 tokens.css 完全一致', () => {
    const { light, inkLight } = deriveRoles(THEMES['雲'])
    expect(light).toEqual(TOKENS.A.light)
    expect(inkLight).toBe(TOKENS.A.ink)
  })

  it('家族 A（雲）深色莫蘭蒂化 hex 與 tokens.css 逐字一致', () => {
    const { dark, inkDark } = deriveRoles(THEMES['雲'])
    expect(dark).toEqual(TOKENS.A.dark)
    expect(inkDark).toBe(TOKENS.A.inkDark)
  })

  it('家族 B（陶）深色莫蘭蒂化 hex 與 tokens.css 逐字一致', () => {
    const { dark, inkDark, light } = deriveRoles(THEMES['陶'])
    expect(dark).toEqual(TOKENS.B.dark)
    expect(inkDark).toBe(TOKENS.B.inkDark)
    expect(light).toEqual(TOKENS.B.light)
  })
})

describe('WCAG 對比遍歷：8 主題 × 淺/深 × ink 對 bg-0/1/2 ≥ 4.5:1', () => {
  for (const [name, colors] of Object.entries(THEMES)) {
    const { light, dark, inkLight, inkDark } = deriveRoles(colors)

    it(`${name} 淺色：ink 對 bg-0/1/2 ≥ 4.5`, () => {
      for (const [role, bg] of light.slice(0, 3).entries()) {
        const ratio = contrastRatio(inkLight, bg)
        expect(ratio, `${name} 淺 ink vs 角色${role}(${bg}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
      }
    })

    it(`${name} 深色：inkDark 對 bg-0/1/2 ≥ 4.5`, () => {
      for (const [role, bg] of dark.slice(0, 3).entries()) {
        const ratio = contrastRatio(inkDark, bg)
        expect(ratio, `${name} 深 ink vs 角色${role}(${bg}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})

describe('OKLCH 數學健全性', () => {
  it('白與黑互為極值、往返穩定', () => {
    expect(toLch('#FFFFFF').l).toBeCloseTo(1.0, 2)
    expect(toLch('#000000').l).toBeCloseTo(0.0, 2)
  })

  it('對比度計算與已知值相符（黑白 = 21:1）', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })
})
