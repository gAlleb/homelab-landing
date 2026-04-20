const CACHE = 'homelab-v1'

const PRECACHE = [
  '/',
  '/local',
  '/external',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  
  // 1. ПОЛНОСТЬЮ игнорируем запросы к API (статусы, пинги)
  if (url.pathname.startsWith('/api/')) return

  // 2. Игнорируем внешние запросы (проверки статуса внешних ссылок)
  if (url.origin !== location.origin) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Пытаемся получить свежую версию из сети
      return fetch(e.request).then((resp) => {
        if (resp.ok) {
          const clone = resp.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return resp
      }).catch(() => {
        // Если сеть упала, отдаем из кеша. Если и в кеше нет — просто возвращаем ошибку
        return cached || Promise.reject('No network and no cache')
      })
    }).catch(() => {
      // Глобальный обработчик чтобы не было Uncaught
      return new Response('Network error', { status: 408 })
    }),
  )
})
