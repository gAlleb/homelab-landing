export type StatusValue = 'checking' | 'up' | 'down' | 'unknown'

export function useStatuses() {
  const statuses = useState<Record<string, StatusValue>>('svc-statuses', () => ({}))
  const lastChecked = useState<Record<string, number>>('svc-last-checked', () => ({}))

  const upCount = computed(() => Object.values(statuses.value).filter(s => s === 'up').length)
  const downCount = computed(() => Object.values(statuses.value).filter(s => s === 'down').length)
  const totalChecked = computed(() => Object.values(statuses.value).filter(s => s !== 'checking').length)

  function setStatus(url: string, status: StatusValue) {
    statuses.value = { ...statuses.value, [url]: status }
    if (status === 'up' || status === 'down') {
      lastChecked.value = { ...lastChecked.value, [url]: Date.now() }
    }
  }

  return { statuses, lastChecked, upCount, downCount, totalChecked, setStatus }
}
