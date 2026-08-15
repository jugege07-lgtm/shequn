/**
 * 全局轻提示工具（非阻塞，兼容 uni-app 与纯浏览器环境）
 * 在 H5/WebView 中优先生成自定义 DOM toast，避免使用阻塞式 alert()
 * 避免自动化测试或移动端因 alert() 弹窗导致页面挂起。
 */

export function showToast(msg: string) {
  if (typeof uni !== 'undefined' && uni.showToast) {
    uni.showToast({ title: msg, icon: 'none' })
    return
  }
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'mobile-toast'
  el.textContent = msg
  el.style.cssText =
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;animation:toastFade 2s ease forwards'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

// 注入 toast 淡入淡出动画
if (typeof document !== 'undefined') {
  const styleId = 'mobile-toast-anim'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent =
      '@keyframes toastFade{0%{opacity:0}10%{opacity:1}80%{opacity:1}100%{opacity:0}}'
    document.head.appendChild(style)
  }
}