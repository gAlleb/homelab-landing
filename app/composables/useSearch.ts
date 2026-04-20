export function useSearch() {
  const searchOpen = useState('search-open', () => false)
  function open() { searchOpen.value = true }
  function close() { searchOpen.value = false }
  return { searchOpen, open, close }
}
