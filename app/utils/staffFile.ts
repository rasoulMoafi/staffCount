import type { StaffEntry } from '~/composables/useStaffStorage'

export interface StaffFileItem {
  name: string
  warehouse: number
  car: number
}

interface RawFileItem {
  name?: string
  count?: number
  warehouse?: number
  car?: number
}

export function serializeStaffToText(staff: StaffEntry[]) {
  const payload = {
    version: 2,
    items: staff.map(entry => ({
      name: entry.name,
      warehouse: entry.warehouse,
      car: entry.car,
    })),
  }

  return JSON.stringify(payload, null, 2)
}

export function parseStaffFromText(text: string): StaffFileItem[] {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as
        | { items?: RawFileItem[], staff?: RawFileItem[] }
        | RawFileItem[]

      if (Array.isArray(parsed)) {
        return normalizeItems(parsed)
      }

      if (Array.isArray(parsed.items)) {
        return normalizeItems(parsed.items)
      }

      if (Array.isArray(parsed.staff)) {
        return normalizeItems(parsed.staff)
      }
    }
    catch {
      // Fall through to line-based parsing.
    }
  }

  return trimmed
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.includes('\t') ? '\t' : ','
      const parts = line.split(separator)
      const name = parts[0]?.trim() ?? ''
      const warehouse = Number(parts[1])
      const car = Number(parts[2])

      return {
        name,
        warehouse: Number.isFinite(warehouse) ? warehouse : 0,
        car: Number.isFinite(car) ? car : 0,
      }
    })
    .filter(item => item.name)
}

function normalizeItems(items: RawFileItem[]) {
  return items
    .map((item) => {
      const hasNewFields = item.warehouse !== undefined || item.car !== undefined

      return {
        name: String(item.name ?? '').trim(),
        warehouse: Math.max(0, Number(hasNewFields ? item.warehouse : item.count) || 0),
        car: Math.max(0, Number(item.car) || 0),
      }
    })
    .filter(item => item.name)
}

function sanitizeFileName(name: string) {
  const sanitized = name.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-')
  const base = sanitized || 'staff-count'
  return base.endsWith('.txt') ? base : `${base}.txt`
}

export function downloadStaffFile(staff: StaffEntry[], fileName: string) {
  const content = serializeStaffToText(staff)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = sanitizeFileName(fileName)
  link.click()
  URL.revokeObjectURL(url)
}
