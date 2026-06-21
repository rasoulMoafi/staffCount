export interface StaffEntry {
  id: number
  name: string
  warehouse: number
  car: number
}

interface StoredEntry {
  id: number
  name: string
  count?: number
  warehouse?: number
  car?: number
}

interface StoredData {
  nextId: number
  staff: StoredEntry[]
}

const STORAGE_KEY = 'staff-count-data'

function normalizeEntry(entry: StoredEntry): StaffEntry {
  return {
    id: entry.id,
    name: entry.name,
    warehouse: Math.max(0, Number(entry.warehouse ?? entry.count) || 0),
    car: Math.max(0, Number(entry.car) || 0),
  }
}

function loadFromStorage(): { nextId: number, staff: StaffEntry[] } {
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
      staff: Array.isArray(parsed.staff)
        ? parsed.staff.map(normalizeEntry)
        : [],
    }
  }
  catch {
    return { nextId: 1, staff: [] }
  }
}

function saveToStorage(data: { nextId: number, staff: StaffEntry[] }) {
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

  function addStaff(name: string, warehouse: number, car: number) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }

    staff.value.unshift({
      id: nextId.value++,
      name: trimmedName,
      warehouse: Math.max(0, warehouse),
      car: Math.max(0, car),
    })
    return true
  }

  function updateStaff(id: number, name: string, warehouse: number, car: number) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return false
    }

    const entry = staff.value.find(item => item.id === id)
    if (!entry) {
      return false
    }

    entry.name = trimmedName
    entry.warehouse = Math.max(0, warehouse)
    entry.car = Math.max(0, car)
    return true
  }

  function removeStaff(id: number) {
    staff.value = staff.value.filter(entry => entry.id !== id)
  }

  function replaceStaff(entries: { name: string, warehouse: number, car: number }[]) {
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
        warehouse: Math.max(0, entry.warehouse),
        car: Math.max(0, entry.car),
      })
      importedCount++
    }

    staff.value = newStaff
    return importedCount
  }

  const totalWarehouse = computed(() =>
    staff.value.reduce((sum, entry) => sum + entry.warehouse, 0),
  )

  const totalCar = computed(() =>
    staff.value.reduce((sum, entry) => sum + entry.car, 0),
  )

  return {
    staff,
    isReady,
    addStaff,
    updateStaff,
    removeStaff,
    replaceStaff,
    totalWarehouse,
    totalCar,
  }
}
