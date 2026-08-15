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
  // 状态栏占位：各页面根元素绑定 :style="sbStyle"（import 自 @/utils/sb 的闭包引用，
  // 真机可靠；全局 mixin computed 经 ctx 解析在真机上不稳定，已弃用）
  // 应用启动时恢复登录会话（等价移动端 main.ts 的 restoreSession）
  useUserStore(pinia).restoreSession()
  return { app }
}
