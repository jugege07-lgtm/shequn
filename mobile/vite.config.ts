import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(() => {
  // 原生 App（Capacitor）构建时，WebView 以根路径加载资源，base 必须为 '/'
  // H5 部署在 /h5/ 子路径，base 保持 '/h5/'
  const isNative = process.env.VITE_NATIVE_BUILD === 'true'
  return {
    base: isNative ? '/' : '/h5/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5175,
      host: '0.0.0.0',
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
