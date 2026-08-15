/**
 * 全局提示框工具（阻塞式模态，需用户点击确认）
 * 与 toast.ts 同款 DOM 注入方案：兼容 H5 / WebView，不引入 UI 组件库。
 * 用途：敏感词审核命中等需要用户明确知晓并修改内容的场景。
 */

export interface DialogOptions {
  title?: string
  content: string
  confirmText?: string
  onConfirm?: () => void
}

export function showDialog(opts: DialogOptions) {
  // uni 环境（App/H5 打包到 uni 运行时）优先用原生模态
  if (typeof uni !== 'undefined' && uni.showModal) {
    uni.showModal({
      title: opts.title || '提示',
      content: opts.content,
      showCancel: false,
      confirmText: opts.confirmText || '我知道了',
      success: () => opts.onConfirm?.(),
    })
    return
  }

  // 纯浏览器环境：自绘 DOM 模态框
  const existing = document.querySelector('.mobile-dialog-mask')
  if (existing) existing.remove()

  const mask = document.createElement('div')
  mask.className = 'mobile-dialog-mask'
  mask.innerHTML = `
    <div class="mobile-dialog">
      <div class="mobile-dialog-title">${opts.title || '提示'}</div>
      <div class="mobile-dialog-content">${opts.content}</div>
      <div class="mobile-dialog-footer">
        <button class="mobile-dialog-btn">${opts.confirmText || '我知道了'}</button>
      </div>
    </div>
  `
  const close = () => {
    mask.remove()
    opts.onConfirm?.()
  }
  mask.querySelector('.mobile-dialog-btn')!.addEventListener('click', close)
  document.body.appendChild(mask)

  if (!document.getElementById('mobile-dialog-style')) {
    const style = document.createElement('style')
    style.id = 'mobile-dialog-style'
    style.textContent = `
      .mobile-dialog-mask {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0, 0, 0, 0.55);
        display: flex; align-items: center; justify-content: center;
        animation: mdFadeIn 0.18s ease;
      }
      .mobile-dialog {
        width: 78%; max-width: 320px; background: #fff; border-radius: 14px;
        overflow: hidden; padding: 22px 20px 14px;
        display: flex; flex-direction: column; align-items: center;
      }
      .mobile-dialog-title {
        font-size: 16px; font-weight: 600; color: #1e1b4b; margin-bottom: 12px; text-align: center;
      }
      .mobile-dialog-content {
        font-size: 14px; color: #4b5563; line-height: 1.6;
        text-align: center; word-break: break-all; margin-bottom: 18px;
      }
      .mobile-dialog-footer { width: 100%; }
      .mobile-dialog-btn {
        width: 100%; height: 40px; border: none; border-radius: 20px;
        background: #6366f1; color: #fff; font-size: 15px; cursor: pointer;
      }
      @keyframes mdFadeIn { from { opacity: 0 } to { opacity: 1 } }
    `
    document.head.appendChild(style)
  }
}
