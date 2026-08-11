/**
 * 图片压缩工具：针对封面上传与富文本编辑器上传的大图做自动压缩，减少体积、加快加载。
 *
 * 策略：
 * - 压缩阈值：图片最长边 > MAX_EDGE(1920px) 或 文件体积 > MAX_BYTES(2MB) 时触发压缩
 * - 压缩比例：canvas 等比缩放后按 JPEG 质量 0.82 导出
 * - 压缩后仍超过 MAX_BYTES 时，逐步降低质量直至达标（下限 0.5）
 * - 透明 PNG 强制转 JPEG 时补白底，避免黑底
 */

export const MAX_EDGE = 1920 // 最长边像素阈值
export const MAX_BYTES = 2 * 1024 * 1024 // 体积阈值 2MB
export const INITIAL_QUALITY = 0.82 // 初始压缩质量
export const MIN_QUALITY = 0.5 // 质量下限

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = url
  })
}

function drawToCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  isPng: boolean
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')!
  // PNG 透明背景导出 JPEG 会成为黑底，先铺白底
  if (isPng) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * 压缩图片文件。返回压缩后的 Blob（以 File 形式返回），若无需压缩则返回原文件。
 * 触发条件：最长边 > MAX_EDGE 或 文件体积 > MAX_BYTES，任一满足即压缩。
 */
export async function compressImage(file: File): Promise<File> {
  const isImage = file.type.startsWith('image/')
  if (!isImage) return file

  const isPng = file.type === 'image/png'
  const img = await loadImage(file)
  const edge = Math.max(img.naturalWidth, img.naturalHeight)

  // 尺寸与体积均未超阈值，无需压缩，直接返回原文件
  if (edge <= MAX_EDGE && file.size <= MAX_BYTES) return file

  // 等比缩放
  const scale = Math.min(1, MAX_EDGE / edge)
  const targetWidth = Math.max(1, Math.round(img.naturalWidth * scale))
  const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale))

  const mimeType = isPng || file.type === 'image/webp' ? 'image/jpeg' : file.type
  let quality = INITIAL_QUALITY
  let output: Blob | null = null

  // 逐步降低质量，直至体积达标或达到下限
  for (;;) {
    const canvas = drawToCanvas(img, targetWidth, targetHeight, isPng || file.type === 'image/webp')
    output = await canvasToBlob(canvas, mimeType, quality)
    if (!output) break
    if (output.size <= MAX_BYTES || quality <= MIN_QUALITY) break
    quality -= 0.1
  }
  if (!output) return file

  // 压缩后仍然更大（极小概率），则回退原文件
  if (output.size >= file.size) return file

  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1]
  const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext
  return new File([output], name, { type: mimeType })
}