export interface StaffEntry {
  id: number
  name: string
  count: number
}

interface StoredData {
  nextId: number
  staff: StaffEntry[]
}

const STORAGE_KEY = 'staff-count-data'

function loadFromStorage(): StoredData {
  if (!import.meta.client) {
    return { nextId: 1, staff: [] }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { nextId: 1, staff: [] }
    }

    const parsed = JSON.parse(raw) as StoredData
    return {
      nextId: parsed.nextId ?? 1,
      staff: Array.isArray(parsed.staff) ? parsed.staff : [],
    }
  }
  catch {
    return { nextId: 1, staff: [] }
  }
}

function saveToStorage(data: StoredData) {
  if (!import.meta.client) {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useStaffStorage() {
  const staff = ref<StaffEntry[]>([])
  const nextId = ref(1)
  const isReady = ref(false)

  onMounted(() => {
    const stored = loadFromStorage()
    staff.value = stored.staff
    nextId.value = stored.nextId
    isReady.value = true

    watch(
      [staff, nextId],
      () => {
        saveToStorage({
          nextId: nextId.value,
          staff: staff.value,
        })
      },
      { deep: true },
    )
  })

  function addStaff(name: string, count: number) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }

    staff.value.unshift({
      id: nextId.value++,
      name: trimmedName,
      count: Math.max(0, count),
    })
    return true
  }

  function updateStaff(id: number, name: string, count: number) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }

    const entry = staff.value.find(item => item.id === id)
    if (!entry) {
      return false
    }

    entry.name = trimmedName
    entry.count = Math.max(0, count)
    return true
  }

  function removeStaff(id: number) {
    staff.value = staff.value.filter(entry => entry.id !== id)
  }

  function replaceStaff(entries: { name: string, count: number }[]) {
    const newStaff: StaffEntry[] = []
    let importedCount = 0

    for (const entry of entries) {
      const trimmedName = entry.name.trim()
      if (!trimmedName) {
        continue
      }

      newStaff.push({
        id: nextId.value++,
        name: trimmedName,
        count: Math.max(0, entry.count),
      })
      importedCount++
    }

    staff.value = newStaff
    return importedCount
  }

  const totalCount = computed(() =>
    staff.value.reduce((sum, entry) => sum + entry.count, 0),
  )

  return {
    staff,
    isReady,
    addStaff,
    updateStaff,
    removeStaff,
    replaceStaff,
    totalCount,
  }
}
