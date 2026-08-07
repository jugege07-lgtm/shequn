import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  // 与管理端在代理中的挂载路径保持一致（/admin），避免路由 base 与代理路径不匹配导致白屏
  base: '/admin/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      '/uploads': {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
