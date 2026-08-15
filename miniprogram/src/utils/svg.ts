/**
 * 内联 SVG 图标 → data URI（小程序不支持模板内联 <svg>）
 * 用法：script 中生成一次，模板用 <image :src="icon" />
 * 颜色必须显式传入（data URI 中 currentColor 不生效）
 */
export interface SvgOptions {
  color?: string
  fill?: string
  strokeWidth?: string
  viewBox?: string
  strokeLinecap?: string
  strokeLinejoin?: string
}

export function svgUri(inner: string, opts: SvgOptions = {}): string {
  const {
    color = '#6b7280',
    fill = 'none',
    strokeWidth = '2',
    viewBox = '0 0 24 24',
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
  } = opts
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}">${inner}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}
