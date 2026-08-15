import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      // vue-router 兼容 shim：页面代码沿用 useRouter/useRoute，底层映射到 uni 导航
      'vue-router': resolve(__dirname, 'src/shims/vue-router.ts'),
      '@': resolve(__dirname, 'src'),
    },
  },
})
