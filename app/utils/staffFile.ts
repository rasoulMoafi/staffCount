import type { StaffEntry } from '~/composables/useStaffStorage'

export interface StaffFileItem {
  name: string
  count: number
}

export function serializeStaffToText(staff: StaffEntry[]) {
  const payload = {
    version: 1,
    items: staff.map(entry => ({
      name: entry.name,
      count: entry.count,
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
        | { items?: StaffFileItem[], staff?: StaffFileItem[] }
        | StaffFileItem[]

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
      const [name, countValue] = line.split(separator)
      const parsedCount = Number(countValue)

      return {
        name: name?.trim() ?? '',
        count: Number.isFinite(parsedCount) ? parsedCount : 0,
      }
    })
    .filter(item => item.name)
}

function normalizeItems(items: StaffFileItem[]) {
  return items
    .map(item => ({
      name: String(item.name ?? '').trim(),
      count: Math.max(0, Number(item.count) || 0),
    }))
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
