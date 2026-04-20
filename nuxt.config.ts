export default defineNuxtConfig({
  compatibilityDate: '2025-11-02',

  modules: ['@nuxt/ui'],

  ssr: true,

  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/local', '/external'],
    },
  },

  app: {
    head: {
      title: 'Homelab',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'apple-touch-icon', href: '/icon.svg' },
      ],
      meta: [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Homelab' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
    },
  },
})
