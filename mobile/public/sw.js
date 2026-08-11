/* 社群名片 - Service Worker
 * 策略：应用外壳（页面/清单/图标）优先缓存，提升加载与离线可用；
 * 其余请求（API、图片等动态内容）走网络优先，确保数据始终最新。
 */
const CACHE_NAME = 'shequn-app-v1'
const APP_SHELL = [
  '/h5/',
  '/h5/index.html',
  '/h5/manifest.webmanifest',
  '/h5/logo.jpg',
  '/h5/icons/icon-96.png',
  '/h5/icons/icon-192.png',
  '/h5/icons/icon-512.png',
  '/h5/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 仅接管同源请求（API 由后端域名处理，不缓存）
  if (url.origin !== self.location.origin) return

  // 导航请求：网络优先，失败回退缓存的应用外壳
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/h5/index.html', copy))
          return res
        })
        .catch(() => caches.match('/h5/index.html'))
    )
    return
  }

  // 静态资源（JS/CSS/图标等）：缓存优先，回退网络
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    )
    return
  }

  // 其余：网络优先，成功后写入缓存
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && url.pathname.startsWith('/h5/')) {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        }
        return res
      })
      .catch(() => caches.match(event.request))
  )
})