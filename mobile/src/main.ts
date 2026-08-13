import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user'
import '@/styles/design-tokens.css'
import '@/styles/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 安卓物理返回键 / 手势返回处理：
// 无 @capacitor/app 的 backButton 监听时，WebView 无历史则直接 finish() 退出 App。
// 这里统一接管：有路由历史则后退，否则回首页；在首页再按返回才退出 App。
if (Capacitor.isNativePlatform()) {
  CapApp.addListener('backButton', () => {
    if (router.currentRoute.value.path === '/') {
      // 已在首页，退出 App
      CapApp.exitApp()
    } else if (window.history.length > 1) {
      router.back()
    } else {
      router.replace('/')
    }
  })
}

// 应用启动时恢复登录会话：若本地凭证已过期则自动清理
// 在 router 挂载后、mount 前调用，确保路由守卫能拿到正确的登录状态
useUserStore().restoreSession()

// 注册简易 v-loading 指令（移动端无 Element Plus，提供最小化 loading 遮罩）
app.directive('loading', {
  mounted(el: HTMLElement, binding) {
    el.style.position = el.style.position || 'relative'
    if (binding.value) createLoadingMask(el)
  },
  updated(el: HTMLElement, binding) {
    if (binding.value && !el.querySelector('.mobile-loading-mask')) {
      createLoadingMask(el)
    } else if (!binding.value) {
      const mask = el.querySelector('.mobile-loading-mask')
      if (mask) mask.remove()
    }
  },
  unmounted(el: HTMLElement) {
    const mask = el.querySelector('.mobile-loading-mask')
    if (mask) mask.remove()
  },
})

function createLoadingMask(el: HTMLElement) {
  const mask = document.createElement('div')
  mask.className = 'mobile-loading-mask'
  mask.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.6);backdrop-filter:blur(4px);z-index:100;min-height:80px;'
  mask.innerHTML = '<div style="width:28px;height:28px;border:2.5px solid #e5e7eb;border-top-color:#6366f1;border-radius:50%;animation:mobile-spin 0.8s linear infinite;"></div>'
  if (!document.getElementById('mobile-loading-style')) {
    const style = document.createElement('style')
    style.id = 'mobile-loading-style'
    style.textContent = '@keyframes mobile-spin{to{transform:rotate(360deg)}}'
    document.head.appendChild(style)
  }
  el.appendChild(mask)
}

app.mount('#app')
