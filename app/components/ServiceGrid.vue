<script setup lang="ts">
import type { ServiceLink } from '~/composables/useLinks'

const props = defineProps<{
  links: ServiceLink[]
  storageKey?: string
}>()

// ── Status tracking ───────────────────────────────────────────────────
const { statuses, setStatus } = useStatuses()

function isLocalAddr(url: string): boolean {
  try {
    const h = new URL(url).hostname
    return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|127\.|localhost$)/.test(h)
      || /^\[?[0-9a-f]{1,4}:/.test(h)
  } catch { return false }
}

async function checkStatus(url: string) {
  if (isLocalAddr(url)) { setStatus(url, 'unknown'); return }
  setStatus(url, 'checking')
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(5000) })
    setStatus(url, 'up')
  } catch {
    setStatus(url, 'down')
  }
}

const RECHECK_MS = 150_000 // 2.5 минуты

// ── Last-checked display ──────────────────────────────────────────────
const lastCheckTime = ref<number | null>(null)
const nowTick = ref(Date.now())

const checkedAgoText = computed(() => {
  nowTick.value
  if (!lastCheckTime.value) return null
  const sec = Math.floor((Date.now() - lastCheckTime.value) / 1000)
  if (sec < 15) return 'только что'
  if (sec < 60) return `${sec}с назад`
  return `${Math.floor(sec / 60)} мин назад`
})

function runChecks() {
  lastCheckTime.value = Date.now()
  props.links.forEach(l => checkStatus(l.url))
}

let recheckTimer: ReturnType<typeof setInterval>
let tickTimer: ReturnType<typeof setInterval>

onMounted(() => {
  runChecks()
  recheckTimer = setInterval(runChecks, RECHECK_MS)
  tickTimer = setInterval(() => { nowTick.value = Date.now() }, 30_000)
})
onUnmounted(() => {
  clearInterval(recheckTimer)
  clearInterval(tickTimer)
})

// ── Drag & drop order ─────────────────────────────────────────────────
const localOrder = ref<string[]>([])

onMounted(() => {
  if (props.storageKey) {
    try {
      const saved = localStorage.getItem(`homelab-order-${props.storageKey}`)
      if (saved) localOrder.value = JSON.parse(saved)
    } catch {}
  }
})

function saveOrder(order: string[]) {
  localOrder.value = order
  if (props.storageKey) {
    try { localStorage.setItem(`homelab-order-${props.storageKey}`, JSON.stringify(order)) } catch {}
  }
}

const orderedLinks = computed(() => {
  if (!localOrder.value.length) return props.links
  const map = new Map(props.links.map(l => [l.url, l]))
  const result: ServiceLink[] = []
  localOrder.value.forEach(url => { if (map.has(url)) result.push(map.get(url)!) })
  props.links.forEach(l => { if (!localOrder.value.includes(l.url)) result.push(l) })
  return result
})

// ── Filters ───────────────────────────────────────────────────────────
const activeCategory = ref<string | null>(null)
const filterYgg = ref(false)

const categories = computed(() =>
  [...new Set(props.links.map(l => l.category).filter(Boolean))] as string[],
)
const hasYggdrasil = computed(() =>
  props.links.some(l => l.ips?.some(ip => ip.label === 'Yggdrasil')),
)
const showFilters = computed(() => categories.value.length > 1 || hasYggdrasil.value)

// Drag enabled only when no filter is active (we reorder the full list)
const isDragEnabled = computed(() => !activeCategory.value && !filterYgg.value)

const filteredLinks = computed(() => {
  let res = orderedLinks.value
  if (activeCategory.value) res = res.filter(l => l.category === activeCategory.value)
  if (filterYgg.value) res = res.filter(l => l.ips?.some(ip => ip.label === 'Yggdrasil'))
  return res
})

function setCategory(cat: string | null) {
  activeCategory.value = activeCategory.value === cat ? null : cat
}

// ── Drag & drop ───────────────────────────────────────────────────────
const draggedUrl = ref<string | null>(null)
const dragOverUrl = ref<string | null>(null)

function onDragStart(e: DragEvent, url: string) {
  draggedUrl.value = url
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    // Invisible drag ghost
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:fixed;top:-9999px;opacity:0'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => ghost.remove(), 0)
  }
}

function onDragOver(e: DragEvent, url: string) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverUrl.value = url
}

function onDragLeave(e: DragEvent, url: string) {
  const related = e.relatedTarget as Node | null
  if (related && (e.currentTarget as Node).contains(related)) return
  if (dragOverUrl.value === url) dragOverUrl.value = null
}

function onDrop(e: DragEvent, targetUrl: string) {
  e.preventDefault()
  if (!draggedUrl.value || draggedUrl.value === targetUrl) { onDragEnd(); return }

  const order = orderedLinks.value.map(l => l.url)
  const fromIdx = order.indexOf(draggedUrl.value)
  const toIdx = order.indexOf(targetUrl)
  if (fromIdx === -1 || toIdx === -1) { onDragEnd(); return }

  order.splice(fromIdx, 1)
  order.splice(toIdx, 0, draggedUrl.value)
  saveOrder(order)
  onDragEnd()
}

function onDragEnd() {
  draggedUrl.value = null
  dragOverUrl.value = null
}

// ── Copy ──────────────────────────────────────────────────────────────
const copied = ref<string | null>(null)

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = text
    setTimeout(() => { if (copied.value === text) copied.value = null }, 2000)
  } catch {}
}

// ── Expandable IPs ────────────────────────────────────────────────────
const expanded = ref<Set<string>>(new Set())

function toggleExpand(url: string) {
  const s = new Set(expanded.value)
  s.has(url) ? s.delete(url) : s.add(url)
  expanded.value = s
}
</script>

<template>
  <div>
    <!-- Filter pills + last-checked row -->
    <div v-if="showFilters || checkedAgoText" class="flex flex-wrap items-center gap-2 mb-5">
      <!-- Category pills -->
      <template v-if="showFilters">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="rounded-lg px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer border"
          :class="activeCategory === cat
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
            : 'bg-white/60 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'"
          @click="setCategory(cat)"
        >
          {{ cat }}
        </button>
        <!-- Yggdrasil toggle -->
        <button
          v-if="hasYggdrasil"
          type="button"
          class="rounded-lg px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer border"
          :class="filterYgg
            ? 'bg-violet-600 text-white border-violet-600'
            : 'bg-white/60 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'"
          @click="filterYgg = !filterYgg"
        >
          🌐 Yggdrasil
        </button>
      </template>

      <!-- Spacer -->
      <span class="flex-1" />

      <!-- Last checked + refresh -->
      <div class="flex items-center gap-1.5">
        <span v-if="checkedAgoText" class="text-xs text-zinc-400 dark:text-zinc-500">
          Проверено: {{ checkedAgoText }}
        </span>
        <button
          type="button"
          class="rounded-lg p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-all duration-150"
          title="Проверить сейчас"
          @click="runChecks()"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Drag hint -->
    <p
      v-if="isDragEnabled && orderedLinks.length > 1"
      class="text-xs text-zinc-300 dark:text-zinc-600 mb-3 select-none"
    >
      Перетащите карточки чтобы изменить порядок
    </p>

    <!-- Empty state -->
    <p v-if="!filteredLinks.length" class="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">
      Нет сервисов по выбранному фильтру
    </p>

    <!-- Cards grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <a
        v-for="link in filteredLinks"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        :draggable="isDragEnabled"
        class="group relative block rounded-2xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
        :class="{
          'opacity-40 scale-95 cursor-grabbing': draggedUrl === link.url,
          'ring-2 ring-orange-500 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950 scale-[1.02]': dragOverUrl === link.url && draggedUrl !== link.url,
          'hover:-translate-y-0.5': draggedUrl === null,
          'cursor-grab': isDragEnabled && draggedUrl === null,
        }"
        @dragstart="isDragEnabled && onDragStart($event, link.url)"
        @dragover="isDragEnabled && onDragOver($event, link.url)"
        @dragleave="isDragEnabled && onDragLeave($event, link.url)"
        @drop="isDragEnabled && onDrop($event, link.url)"
        @dragend="onDragEnd()"
      >
        <!-- Hover glow -->
        <div :class="`absolute -inset-1 rounded-3xl bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`" />
        <!-- Gradient border -->
        <div :class="`relative rounded-2xl bg-gradient-to-br ${link.gradient} p-px shadow-lg group-hover:shadow-xl transition-shadow duration-300`">
          <div class="rounded-[15px] bg-white dark:bg-zinc-900 flex flex-col h-full transition-colors duration-200 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/80 overflow-hidden">

            <!-- Drag handle (shown on hover when drag enabled) -->
            <div
              v-if="isDragEnabled"
              class="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10"
            >
              <svg class="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
              </svg>
            </div>

            <!-- Header row -->
            <div class="flex items-center gap-3 p-5 pb-4">
              <!-- Icon square -->
              <div :class="`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-sm`">
                <Icon v-if="link.icon" :name="link.icon" class="w-5 h-5 text-white" />
                <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
                  <circle cx="6" cy="6" r="1" fill="white" stroke="none" /><circle cx="6" cy="18" r="1" fill="white" stroke="none" />
                </svg>
              </div>
              <!-- Name + description -->
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-zinc-900 dark:text-white leading-tight truncate">{{ link.name }}</p>
                <p class="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{{ link.description }}</p>
              </div>
              <!-- Status dot -->
              <span
                class="flex-shrink-0 w-2 h-2 rounded-full ring-2 ring-white dark:ring-zinc-900 transition-all duration-500"
                :class="{
                  'bg-green-400 shadow-[0_0_7px_2px_rgba(74,222,128,0.7)]': statuses[link.url] === 'up',
                  'bg-red-400': statuses[link.url] === 'down',
                  'bg-zinc-400 dark:bg-zinc-500 animate-pulse': statuses[link.url] === 'checking',
                  'bg-zinc-300 dark:bg-zinc-600': !statuses[link.url] || statuses[link.url] === 'unknown',
                }"
                :title="({ up: 'Онлайн', down: 'Недоступен', checking: 'Проверка…', unknown: 'Локальный' } as Record<string, string>)[statuses[link.url] ?? 'unknown']"
              />
              <!-- External link icon -->
              <svg class="flex-shrink-0 w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors duration-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M15 3h6v6M10 14 21 3m-3 10v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h7" />
              </svg>
            </div>

            <!-- Footer: URL + copy + IPs toggle -->
            <div class="border-t border-zinc-100 dark:border-zinc-700/50 px-5 py-3 flex items-center gap-1.5">
              <p class="text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate flex-1 min-w-0">{{ link.url }}</p>
              <!-- Copy URL -->
              <button
                class="flex-shrink-0 rounded-md p-1.5 transition-all duration-150"
                :class="copied === link.url
                  ? 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'"
                title="Скопировать URL"
                @click.stop.prevent="copyText(link.url)"
              >
                <svg v-if="copied === link.url" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
              </button>
              <!-- IPs toggle -->
              <button
                v-if="link.ips?.length"
                class="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-all duration-150"
                @click.stop.prevent="toggleExpand(link.url)"
              >
                IPs
                <svg class="w-3 h-3 transition-transform duration-200" :class="expanded.has(link.url) ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </button>
            </div>

            <!-- Expanded IPs -->
            <div
              v-if="expanded.has(link.url) && link.ips?.length"
              class="border-t border-zinc-100 dark:border-zinc-700/50 px-5 py-3 flex flex-col gap-2"
              @click.stop
            >
              <div v-for="ip in link.ips" :key="ip.addr" class="flex items-center gap-2">
                <span class="text-xs font-medium text-zinc-400 dark:text-zinc-500 w-20 flex-shrink-0">{{ ip.label }}</span>
                <code class="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{{ ip.addr }}</code>
                <button
                  class="flex-shrink-0 rounded-md p-1.5 transition-all duration-150"
                  :class="copied === ip.addr
                    ? 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'"
                  :title="copied === ip.addr ? 'Скопировано!' : 'Скопировать'"
                  @click.stop.prevent="copyText(ip.addr)"
                >
                  <svg v-if="copied === ip.addr" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </a>
    </div>
  </div>
</template>
