import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Vite base = '/admin/' 时，访问路径不在 /admin/ 下会被 Vite 拦截，
 * 整个 HTML 被替换成 "did you mean to visit /admin/xxx" 提示页，SPA 无法加载。
 * 这个中间件做两件事：
 *   1. 把 /admin（无尾斜杠）/ /adminxxx（缺斜杠）规范化成 /admin/ 开头
 *   2. 把其它裸路径（/notifications 等）302 到 /admin/... 前缀
 *
 * 仅 dev server 生效（apply: 'serve'），不影响生产构建。
 */
function adminBaseRedirect(): Plugin {
  return {
    name: 'admin-base-redirect',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        const pathname = url.split('?')[0]
        const queryAndHash = url.slice(pathname.length)

        // 放行：根静态资源 / Vite 内部模块 / 后端代理 / favicon / 入口 HTML
        const isInternal =
          pathname === '/' ||
          pathname === '/index.html' ||
          pathname === '/favicon.ico' ||
          pathname === '/vite.svg' ||
          pathname.startsWith('/@') ||        // @vite / @id / @fs / @react-refresh 等
          pathname.startsWith('/node_modules') ||
          pathname.startsWith('/src/') ||
          pathname.startsWith('/assets/') ||
          pathname.startsWith('/api/') ||
          pathname.startsWith('/uploads/')
        if (isInternal) return next()

        // /admin 前缀的路径：必须以 /admin/ 开头（Vite base 严格匹配）
        if (pathname === '/admin' || pathname.startsWith('/admin')) {
          if (pathname === '/admin/' || pathname.startsWith('/admin/')) {
            return next()
          }
          // 缺尾斜杠：补一个斜杠后重定向
          res.statusCode = 302
          res.setHeader('Location', pathname + '/' + queryAndHash)
          res.end()
          return
        }

        // 其它裸路径（含 /）：302 跳转到 /admin 前缀
        const target = pathname === '/' ? '/admin/' : '/admin' + pathname + queryAndHash
        res.statusCode = 302
        res.setHeader('Location', target)
        res.end()
      })
    },
  }
}

export default defineConfig({
  base: '/admin/',
  plugins: [vue(), adminBaseRedirect()],
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
