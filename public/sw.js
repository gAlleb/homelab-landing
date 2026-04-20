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
  // Only handle GET requests for same-origin or cached resources
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Don't cache status-check fetches to external services
  if (url.origin !== location.origin) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then((resp) => {
        if (resp.ok) {
          caches.open(CACHE).then(cache => cache.put(e.request, resp.clone()))
        }
        return resp
      }).catch(() => cached)
      return cached || fresh
    }),
  )
})
