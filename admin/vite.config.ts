import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
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
