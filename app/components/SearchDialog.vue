<script setup lang="ts">
import { useAllLinks } from '~/composables/useLinks'
import { useSearch } from '~/composables/useSearch'

const { searchOpen, close } = useSearch()
const query = ref('')
const allLinks = useAllLinks()

const PAGE_LABELS: Record<string, string> = {
  '/': 'Сервисы',
  '/local': 'Локальная',
  '/external': 'Внешние',
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allLinks.slice(0, 8)
  return allLinks
    .filter(l =>
      l.name.toLowerCase().includes(q)
      || l.description.toLowerCase().includes(q)
      || l.url.toLowerCase().includes(q)
      || l.ips?.some(ip => ip.addr.toLowerCase().includes(q)),
    )
    .slice(0, 12)
})

const selectedIdx = ref(0)
watch(results, () => { selectedIdx.value = 0 })

function openLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
  close()
  query.value = ''
}

function handleClose() {
  close()
  query.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { handleClose(); return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIdx.value = Math.min(selectedIdx.value + 1, results.value.length - 1)
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIdx.value = Math.max(selectedIdx.value - 1, 0)
    return
  }
  if (e.key === 'Enter' && results.value[selectedIdx.value]) {
    openLink(results.value[selectedIdx.value].url)
  }
}

const inputRef = ref<HTMLInputElement | null>(null)
watch(searchOpen, (v) => {
  if (v) nextTick(() => inputRef.value?.focus())
  else query.value = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      leave-active-class="transition-opacity duration-100 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="searchOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center px-4"
        style="padding-top: 12vh"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleClose"
        />

        <!-- Dialog -->
        <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700/60 overflow-hidden">

          <!-- Search input -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/50">
            <svg class="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm outline-none"
              placeholder="Поиск сервисов…"
              @keydown="onKeydown"
            >
            <kbd class="hidden sm:inline-flex items-center text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
          </div>

          <!-- Results list -->
          <div class="max-h-[50vh] overflow-y-auto py-1">
            <div
              v-if="!results.length"
              class="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8"
            >
              Ничего не найдено
            </div>
            <button
              v-for="(link, i) in results"
              :key="link.url"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75"
              :class="i === selectedIdx
                ? 'bg-zinc-100 dark:bg-zinc-800'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'"
              @click="openLink(link.url)"
              @mousemove="selectedIdx = i"
            >
              <!-- Icon -->
              <div :class="`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-sm`">
                <Icon v-if="link.icon" :name="link.icon" class="w-4 h-4 text-white" />
                <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
                </svg>
              </div>
              <!-- Text -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-900 dark:text-white truncate">{{ link.name }}</p>
                <p class="text-xs text-zinc-400 dark:text-zinc-500 truncate">{{ link.description }}</p>
              </div>
              <!-- Page badge -->
              <span class="flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-0.5">
                {{ PAGE_LABELS[link._path] || link._page }}
              </span>
            </button>
          </div>

          <!-- Footer hints -->
          <div class="border-t border-zinc-100 dark:border-zinc-700/50 px-4 py-2 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 select-none">
            <span class="flex items-center gap-1">
              <kbd class="bg-zinc-100 dark:bg-zinc-800 rounded px-1 font-mono">↑↓</kbd>навигация
            </span>
            <span class="flex items-center gap-1">
              <kbd class="bg-zinc-100 dark:bg-zinc-800 rounded px-1 font-mono">↵</kbd>открыть
            </span>
            <span class="flex items-center gap-1">
              <kbd class="bg-zinc-100 dark:bg-zinc-800 rounded px-1 font-mono">ESC</kbd>закрыть
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
