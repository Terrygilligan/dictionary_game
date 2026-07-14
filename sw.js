/*
 * Lexicon Master service worker (hand-rolled, no build dependency).
 *
 * Strategy:
 *   - install:  precache the app shell.
 *   - activate: drop caches from previous versions, take control immediately.
 *   - fetch:
 *       navigations        -> network-first, fall back to cached shell offline.
 *       same-origin GETs   -> stale-while-revalidate (serves Vite's hashed
 *                             JS/CSS instantly, refreshes in the background).
 *
 * Runtime caching means we never need a build-generated precache list, so this
 * file can stay static and dependency-free. Bump CACHE_VERSION to invalidate.
 */
const CACHE_VERSION = 'v2'
const CACHE_NAME = `lexicon-master-${CACHE_VERSION}`
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/'))),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || network
      }),
    ),
  )
})
