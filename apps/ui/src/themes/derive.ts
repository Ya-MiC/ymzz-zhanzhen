// 微明度對比色階梯——OKLCH 深色衍生（build_tokens.py 的逐行 TS 移植）
//
// 規則（施工令第 5 節，色不另造）：
// - 淺色：4 個鎖定色按 OKLCH 明度由亮到暗排序，依次作 bg-0 / bg-1 / bg-2 / accent
// - 深色：每色取互補色相（H+180），彩度壓進 [0.026, 0.046]（×0.8 後 clamp），明度取台階 [0.23, 0.29, 0.35, 0.72]
// - 墨色：淺 from_lch(0.24, 0.02, bgHue)；深 from_lch(0.92, 0.012, darkBgHue)
// 一致性：contrast.test.ts 以 tokens.css 的 A/B 深色 hex 逐字比對，證明 TS 與 Python 產物等價。

// ---- 色彩數學（與 01-brand/tokens/build_tokens.py 一致）----

function hex2rgb(h: string): [number, number, number] {
  const s = h.replace('#', '')
  return [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  ]
}

function rgb2hex(v: [number, number, number]): string {
  const c = (x: number) =>
    Math.round(Math.max(0, Math.min(1, x)) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  return `#${c(v[0])}${c(v[1])}${c(v[2])}`
}

function s2l(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function l2s(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

export interface Lch {
  l: number
  c: number
  h: number
}

export function toLch(hex: string): Lch {
  const [r, g, b] = hex2rgb(hex).map(s2l) as [number, number, number]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: L, c: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 }
}

export function fromLch(L: number, C: number, H: number): string {
  const rad = (H * Math.PI) / 180
  const a = C * Math.cos(rad)
  const b = C * Math.sin(rad)
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return rgb2hex([l2s(r), l2s(g), l2s(bl)])
}

// ---- 角色映射（確定性規則）----

/** 深色明度台階：bg / surface / raised / accent */
const DARK_L = [0.23, 0.29, 0.35, 0.72] as const
const LIGHT_INK_L = 0.24
const DARK_INK_L = 0.92
const C_MIN = 0.026
const C_MAX = 0.046

export interface ThemeRoles {
  /** 淺色四角色：bg-0 / bg-1 / bg-2 / accent */
  light: [string, string, string, string]
  /** 深色四角色：bg-0 / bg-1 / bg-2 / accent（互補莫蘭蒂化） */
  dark: [string, string, string, string]
  /** 淺色墨 */
  inkLight: string
  /** 深色墨 */
  inkDark: string
}

/**
 * 由 4 個鎖定色推導一套主題的淺/深角色。
 * 鎖定色本身不改動；深色是數學衍生的（互補色相＋降彩度＋降明度）。
 */
export function deriveRoles(colors: readonly [string, string, string, string]): ThemeRoles {
  const ranked = [...colors].sort((x, y) => toLch(y).l - toLch(x).l) // 亮 → 暗
  const light = ranked as [string, string, string, string]
  const bgHue = toLch(light[0]).h
  const inkLight = fromLch(LIGHT_INK_L, 0.02, bgHue)

  const dark = DARK_L.map((L, i) => {
    const { c, h } = toLch(ranked[i])
    const clamped = Math.min(C_MAX, Math.max(C_MIN, c * 0.8))
    return fromLch(L, clamped, (h + 180) % 360)
  }) as [string, string, string, string]
  const inkDark = fromLch(DARK_INK_L, 0.012, toLch(dark[0]).h)

  return { light, dark, inkLight, inkDark }
}

/** 向後相容：單色的深色衍生（互補、莫蘭蒂化、降明度） */
export function deriveDark(hex: string, l = 0.29): string {
  const { c, h } = toLch(hex)
  return fromLch(l, Math.min(C_MAX, Math.max(C_MIN, c * 0.8)), (h + 180) % 360)
}

// ---- WCAG 對比度 ----

function luminance(hex: string): number {
  const [r, g, b] = hex2rgb(hex).map(s2l) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const bright = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (bright + 0.05) / (dark + 0.05)
}

// ---- 八個鎖定色（只此八個，取自 vendor/ymzz-wenrun-design-skill/tokens.css）----

export const LOCKED_COLORS = {
  暖紙白: '#F8F6EF',
  淺天空藍: '#B9DDF1',
  荷花粉: '#F4DDE7',
  淡紫: '#CDBFE0',
  燕麥米: '#E8E3CC',
  鼠尾草綠: '#B7C8A8',
  亞麻金: '#CBBF9E',
  可可棕: '#A38E7A',
} as const

/** tokens.css 的墨色（兩家族共用） */
export const INK_LIGHT = '#221F14' // tokens.css light ink
export const INK_DARK = '#E2E4ED' // tokens.css dark ink（家族 A/B 深色同值）
