// localStorage 兼容层必须最先执行（store 模块在导入期读取 localStorage）
import './shims/localStorage'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './shims/vue-router'
import { useUserStore } from './store/user'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // 模板中 $router.push(...) 兼容（移动端页面大量使用）
  app.config.globalProperties.$router = router
  // 应用启动时恢复登录会话（等价移动端 main.ts 的 restoreSession）
  useUserStore(pinia).restoreSession()
  return { app }
}
