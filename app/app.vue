<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const route = useRoute()
const router = useRouter()

// ── Effects ──────────────────────────────────────────────────────────
const bgArtEnabled = ref(true)
const bgGradientEnabled = ref(true)

onMounted(() => {
  try {
    const art = localStorage.getItem('homelab-bg-art')
    if (art !== null) bgArtEnabled.value = art === 'true'
    const grad = localStorage.getItem('homelab-bg-gradient')
    if (grad !== null) bgGradientEnabled.value = grad === 'true'
  } catch {}
})

function toggleBgArt() {
  bgArtEnabled.value = !bgArtEnabled.value
  try { localStorage.setItem('homelab-bg-art', String(bgArtEnabled.value)) } catch {}
}
function toggleBgGradient() {
  bgGradientEnabled.value = !bgGradientEnabled.value
  try { localStorage.setItem('homelab-bg-gradient', String(bgGradientEnabled.value)) } catch {}
}

// ── Theme ────────────────────────────────────────────────────────────
const themeOptions = ['system', 'light', 'dark'] as const
type ThemeOption = (typeof themeOptions)[number]

const themeLabel = computed(() => {
  switch (colorMode.preference as ThemeOption) {
    case 'light': return 'Светлая'
    case 'dark': return 'Тёмная'
    default: return 'Авто'
  }
})
const themeIsLight = computed(() => colorMode.preference === 'light')
const themeIsDark = computed(() => colorMode.preference === 'dark')

function cycleTheme() {
  const idx = themeOptions.indexOf(colorMode.preference as ThemeOption)
  colorMode.preference = themeOptions[(idx + 1) % themeOptions.length]
}

function startViewTransition(event: MouseEvent) {
  if (!document.startViewTransition) { cycleTheme(); return }
  const { clientX: x, clientY: y } = event
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const t = document.startViewTransition(cycleTheme)
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 600, easing: 'cubic-bezier(.76,.32,.29,.99)', pseudoElement: '::view-transition-new(root)' },
    )
  })
}

// ── Page transition direction ────────────────────────────────────────
const pageOrder = ['/', '/local', '/external']
const slideDir = ref('left')

router.beforeEach((to, from) => {
  const ti = pageOrder.indexOf(to.path)
  const fi = pageOrder.indexOf(from.path)
  if (ti !== -1 && fi !== -1)
    slideDir.value = ti > fi ? 'left' : 'right'
})

const pageTransition = computed(() => ({
  name: `page-slide-${slideDir.value}`,
  mode: 'out-in' as const,
}))

// ── Nav active state ─────────────────────────────────────────────────
const isActive = (path: string) => route.path === path

// ── Status counter (global) ──────────────────────────────────────────
const { upCount, downCount } = useStatuses()
const checkedTotal = computed(() => upCount.value + downCount.value)

// ── Cmd/Ctrl+K search ────────────────────────────────────────────────
const { open: openSearch } = useSearch()

onMounted(() => {
  function handleKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openSearch()
    }
  }
  document.addEventListener('keydown', handleKey)
  onUnmounted(() => document.removeEventListener('keydown', handleKey))

  // PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
})

useHead({
  meta: [{ name: 'theme-color', content: () => colorMode.value === 'dark' ? '#09090b' : '#fafafa' }],
})
</script>

<template>
  <div class="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">

    <!-- Animated gradient (dark mode only) -->
    <ClientOnly>
      <div
        v-if="isDark"
        class="fixed inset-0 bg-homelab-gradient pointer-events-none"
        :style="{ zIndex: 0, animationPlayState: bgGradientEnabled ? 'running' : 'paused' }"
      />
    </ClientOnly>

    <!-- BackgroundArt canvas -->
    <ClientOnly>
      <BackgroundArt v-if="bgArtEnabled" />
    </ClientOnly>

    <!-- Controls top-right -->
    <header class="fixed top-0 left-0 right-0 z-50 flex justify-end p-3 pointer-events-none">
      <div class="flex flex-wrap justify-end gap-2 pointer-events-auto">
        <!-- Search button (Cmd+K) -->
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium backdrop-blur-md shadow-sm cursor-pointer select-none transition-all duration-200 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
          @click="openSearch()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span class="hidden sm:inline">Поиск</span>
          <kbd class="hidden sm:inline-flex items-center text-xs opacity-60 bg-zinc-100 dark:bg-zinc-700 rounded px-1 font-mono">⌘K</kbd>
        </button>
        <!-- Theme -->
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium backdrop-blur-md shadow-sm cursor-pointer select-none transition-all duration-200 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
          @click="startViewTransition"
        >
          <svg v-if="themeIsLight" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73 1.41-1.41" />
          </svg>
          <svg v-else-if="themeIsDark" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" />
          </svg>
          <span>{{ themeLabel }}</span>
        </button>
        <!-- Gradient -->
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium backdrop-blur-md border shadow-sm cursor-pointer select-none transition-all duration-200"
          :class="bgGradientEnabled
            ? 'bg-indigo-50/80 dark:bg-indigo-900/25 border-indigo-300/60 dark:border-indigo-600/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/40'
            : 'bg-white/70 dark:bg-zinc-800/70 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-400 dark:text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'"
          @click="toggleBgGradient"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          <span>Фон</span>
        </button>
        <!-- Art -->
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium backdrop-blur-md border shadow-sm cursor-pointer select-none transition-all duration-200"
          :class="bgArtEnabled
            ? 'bg-violet-50/80 dark:bg-violet-900/25 border-violet-300/60 dark:border-violet-600/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100/90 dark:hover:bg-violet-900/40'
            : 'bg-white/70 dark:bg-zinc-800/70 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-400 dark:text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'"
          @click="toggleBgArt"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
          <span>Эффект</span>
        </button>
      </div>
    </header>

    <!-- Page navigation — centered, just below header -->
    <nav class="fixed left-0 right-0 z-40 flex justify-center items-center gap-2 px-4" style="top: 56px">
      <NuxtLink
        to="/"
        class="rounded-xl px-4 py-2 text-sm font-medium backdrop-blur-md border shadow-sm cursor-pointer select-none transition-all duration-200"
        :class="isActive('/') ? 'bg-zinc-900/80 dark:bg-white/10 border-zinc-700/60 dark:border-white/20 text-white dark:text-white' : 'bg-white/70 dark:bg-zinc-800/70 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'"
      >
        Сервисы
      </NuxtLink>
      <NuxtLink
        to="/local"
        class="rounded-xl px-4 py-2 text-sm font-medium backdrop-blur-md border shadow-sm cursor-pointer select-none transition-all duration-200"
        :class="isActive('/local') ? 'bg-zinc-900/80 dark:bg-white/10 border-zinc-700/60 dark:border-white/20 text-white dark:text-white' : 'bg-white/70 dark:bg-zinc-800/70 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'"
      >
        Локальная
      </NuxtLink>
      <NuxtLink
        to="/external"
        class="rounded-xl px-4 py-2 text-sm font-medium backdrop-blur-md border shadow-sm cursor-pointer select-none transition-all duration-200"
        :class="isActive('/external') ? 'bg-zinc-900/80 dark:bg-white/10 border-zinc-700/60 dark:border-white/20 text-white dark:text-white' : 'bg-white/70 dark:bg-zinc-800/70 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'"
      >
        Внешние
      </NuxtLink>

      <!-- Status counter pill -->
      <ClientOnly>
        <span
          v-if="checkedTotal > 0"
          class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium backdrop-blur-md border shadow-sm bg-white/70 dark:bg-zinc-800/70 border-zinc-200/60 dark:border-zinc-700/60 select-none"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_1px_rgba(74,222,128,0.7)]" />
          <span class="text-zinc-700 dark:text-zinc-300">{{ upCount }}<span class="text-zinc-400 dark:text-zinc-500">/{{ checkedTotal }}</span></span>
        </span>
      </ClientOnly>
    </nav>

    <!-- Static hero + transitioning page content -->
    <div class="relative z-10 flex flex-col items-center px-6" style="padding-top: 136px; padding-bottom: 64px">

      <div class="text-center mb-12 select-none">
        <h1 class="text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">Homelab</h1>
        <p class="text-zinc-500 dark:text-zinc-400 text-lg">Локальная инфраструктура</p>
      </div>

      <div class="w-full max-w-4xl">
        <NuxtPage :transition="pageTransition" />
      </div>
    </div>

    <!-- Search dialog (global) -->
    <ClientOnly>
      <SearchDialog />
    </ClientOnly>
  </div>
</template>

<style>
/* View transition: circular reveal */
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
::view-transition-new(root) { z-index: 9999; }
::view-transition-old(root) { z-index: 1; }

/* Page slide transitions */
.page-slide-left-enter-from  { opacity: 0; transform: translateX(36px); }
.page-slide-left-enter-active { transition: opacity 0.25s ease-out, transform 0.25s ease-out; }
.page-slide-left-leave-to    { opacity: 0; transform: translateX(-36px); }
.page-slide-left-leave-active { transition: opacity 0.18s ease-in, transform 0.18s ease-in; }

.page-slide-right-enter-from  { opacity: 0; transform: translateX(-36px); }
.page-slide-right-enter-active { transition: opacity 0.25s ease-out, transform 0.25s ease-out; }
.page-slide-right-leave-to    { opacity: 0; transform: translateX(36px); }
.page-slide-right-leave-active { transition: opacity 0.18s ease-in, transform 0.18s ease-in; }

/* Animated dark gradient */
.bg-homelab-gradient {
  background: linear-gradient(-45deg, #09090b, #0f0a16, #080e17, #080e0c);
  background-size: 400% 400%;
  animation: homelabBgShift 25s ease infinite;
}
@keyframes homelabBgShift {
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
}
</style>
