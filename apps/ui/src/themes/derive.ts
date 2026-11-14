// 微明度對比色階梯（derivation）與對比度測試（stub，P0 驗收用）
// 八個鎖定色取自 vendor/ymzz-wenrun-design-skill/tokens.css，不得自造新色值。

export const LOCKED_COLORS = {
  '暖紙白': '#F8F6EF',
  '淺天空藍': '#B9DDF1',
  '荷花粉': '#F4DDE7',
  '淡紫': '#CDBFE0',
  '燕麥米': '#E8E3CC',
  '鼠尾草綠': '#B7C8A8',
  '亞麻金': '#CBBF9E',
  '可可棕': '#A38E7A',
} as const

export function deriveDark(hex: string): string {
  // OKLCH 互補色相、彩度壓到 ≤0.04、降 1~2 級明度（與 build_tokens.py 保持一致）
  // 此處為骨架；實際計算在 Rust/Python 端，前端僅消費 tokens.css
  return hex
}

export function contrastRatio(a: string, b: string): number {
  const lum = (c: string) => {
    const rgb = c.slice(1).match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  }
  const l1 = lum(a), l2 = lum(b)
  const bright = Math.max(l1, l2), dark = Math.min(l1, l2)
  return (bright + 0.05) / (dark + 0.05)
}
