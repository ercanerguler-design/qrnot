export interface WorldClockCity {
  city: string
  timezone: string
}

export interface HotelMenuItem {
  names: Record<string, string>
  description: Record<string, string>
  price: string
}

export interface HotelMenuSection {
  key: string
  names: Record<string, string>
  items: HotelMenuItem[]
}

export interface HotelMenuConfig {
  languages: string[]
  sections: HotelMenuSection[]
}

export interface RoomServiceItem {
  key: string
  names: Record<string, string>
  price: string
}

export interface HotelRoomServiceConfig {
  languages: string[]
  items: RoomServiceItem[]
}

export interface ServiceTicketCategory {
  key: string
  department: 'housekeeping' | 'technical' | 'concierge'
  names: Record<string, string>
}

export interface HotelServiceTicketConfig {
  languages: string[]
  categories: ServiceTicketCategory[]
}

export type HotelRole = 'platform_admin' | 'hotel_admin' | 'education_admin' | 'staff'

export const DEFAULT_WORLD_CLOCK_CITIES: WorldClockCity[] = [
  { city: 'İstanbul', timezone: 'Europe/Istanbul' },
  { city: 'London', timezone: 'Europe/London' },
  { city: 'New York', timezone: 'America/New_York' },
  { city: 'Dubai', timezone: 'Asia/Dubai' },
  { city: 'Tokyo', timezone: 'Asia/Tokyo' },
  { city: 'Paris', timezone: 'Europe/Paris' },
  { city: 'Singapore', timezone: 'Asia/Singapore' },
]

export const DEFAULT_MENU_LANGUAGES = ['tr', 'en', 'de']

export const DEFAULT_MENU_CONFIG: HotelMenuConfig = {
  languages: DEFAULT_MENU_LANGUAGES,
  sections: [
    {
      key: 'drinks',
      names: { tr: 'Icecekler', en: 'Drinks', de: 'Getranke' },
      items: [
        {
          names: { tr: 'Su', en: 'Water', de: 'Wasser' },
          description: { tr: '', en: '', de: '' },
          price: '50 TL',
        },
      ],
    },
    {
      key: 'main-courses',
      names: { tr: 'Ana Yemekler', en: 'Main Courses', de: 'Hauptgerichte' },
      items: [
        {
          names: { tr: 'Izgara Tavuk', en: 'Grilled Chicken', de: 'Gegrilltes Huhn' },
          description: { tr: '', en: '', de: '' },
          price: '390 TL',
        },
      ],
    },
  ],
}

export const DEFAULT_ROOM_SERVICE_CONFIG: HotelRoomServiceConfig = {
  languages: DEFAULT_MENU_LANGUAGES,
  items: [
    { key: 'water', names: { tr: 'Su', en: 'Water', de: 'Wasser' }, price: '50 TL' },
    { key: 'club-sandwich', names: { tr: 'Club Sandvic', en: 'Club Sandwich', de: 'Club-Sandwich' }, price: '320 TL' },
    { key: 'pasta', names: { tr: 'Makarna', en: 'Pasta', de: 'Pasta' }, price: '360 TL' },
  ],
}

export const DEFAULT_SERVICE_TICKET_CONFIG: HotelServiceTicketConfig = {
  languages: DEFAULT_MENU_LANGUAGES,
  categories: [
    { key: 'extra-towel', department: 'housekeeping', names: { tr: 'Ek Havlu', en: 'Extra Towels', de: 'Extra Handtucher' } },
    { key: 'room-cleaning', department: 'housekeeping', names: { tr: 'Oda Temizligi', en: 'Room Cleaning', de: 'Zimmerreinigung' } },
    { key: 'extra-pillows', department: 'housekeeping', names: { tr: 'Ek Yastik', en: 'Extra Pillows', de: 'Extra Kissen' } },
    { key: 'air-conditioning', department: 'technical', names: { tr: 'Klima Sorunu', en: 'Air Conditioner Issue', de: 'Klimaanlage Problem' } },
    { key: 'tv-wifi', department: 'technical', names: { tr: 'TV / Wi-Fi Sorunu', en: 'TV / Wi-Fi Issue', de: 'TV / WLAN Problem' } },
    { key: 'electricity-light', department: 'technical', names: { tr: 'Elektrik / Isik Arizasi', en: 'Electricity / Light Issue', de: 'Strom / Licht Problem' } },
    { key: 'taxi-call', department: 'concierge', names: { tr: 'Taksi Cagir', en: 'Call Taxi', de: 'Taxi Rufen' } },
    { key: 'airport-transfer', department: 'concierge', names: { tr: 'Havalimani Transfer', en: 'Airport Transfer', de: 'Flughafentransfer' } },
    { key: 'late-checkout', department: 'concierge', names: { tr: 'Gec Cikis Talebi', en: 'Late Checkout Request', de: 'Late Checkout Anfrage' } },
    { key: 'wake-up-call', department: 'concierge', names: { tr: 'Uyandirma Servisi', en: 'Wake-up Call', de: 'Weckruf' } },
  ],
}

export function normalizeHotelCode(input: string) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24)
}

export function normalizeSlug(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20)
}

export function generateModuleSlug(prefix = 'wc') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let part = ''
  for (let i = 0; i < 8; i += 1) {
    part += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${part}`
}

export function parseWorldClockConfig(value: string | null | undefined) {
  if (!value) return DEFAULT_WORLD_CLOCK_CITIES

  try {
    const parsed = JSON.parse(value)
    const rowsRaw = Array.isArray(parsed)
      ? parsed
      : (parsed && typeof parsed === 'object' && Array.isArray((parsed as { cities?: unknown[] }).cities)
          ? (parsed as { cities: unknown[] }).cities
          : null)

    if (!rowsRaw) return DEFAULT_WORLD_CLOCK_CITIES

    const cities = rowsRaw
      .map((item) => ({
        city: String(item?.city || '').trim(),
        timezone: String(item?.timezone || '').trim(),
      }))
      .filter((item) => item.city && item.timezone)

    return cities.length > 0 ? cities : DEFAULT_WORLD_CLOCK_CITIES
  } catch {
    return DEFAULT_WORLD_CLOCK_CITIES
  }
}

function normalizeMenuLanguages(input: unknown) {
  if (!Array.isArray(input)) return DEFAULT_MENU_LANGUAGES

  const normalized = input
    .map((lang) => String(lang || '').trim().toLowerCase())
    .map((lang) => lang.replace(/[^a-z-]/g, '').slice(0, 8))
    .filter(Boolean)

  return normalized.length > 0 ? Array.from(new Set(normalized)) : DEFAULT_MENU_LANGUAGES
}

function sanitizeLocalizedRecord(input: unknown, languages: string[], maxLength: number) {
  const source = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const out: Record<string, string> = {}

  for (const language of languages) {
    out[language] = String(source[language] || '').trim().slice(0, maxLength)
  }

  return out
}

export function parseMenuConfig(value: string | null | undefined): HotelMenuConfig {
  if (!value) return DEFAULT_MENU_CONFIG

  try {
    const parsed = JSON.parse(value)
    const validated = validateMenuConfig(parsed)
    return validated || DEFAULT_MENU_CONFIG
  } catch {
    return DEFAULT_MENU_CONFIG
  }
}

export function validateMenuConfig(input: unknown): HotelMenuConfig | null {
  if (typeof input !== 'object' || input === null) return null

  const src = input as Record<string, unknown>
  const languages = normalizeMenuLanguages(src.languages)

  if (!Array.isArray(src.sections)) return null

  const sections = src.sections
    .map((section) => {
      const sourceSection = typeof section === 'object' && section !== null ? (section as Record<string, unknown>) : null
      if (!sourceSection) return null

      const key = String(sourceSection.key || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24)

      const names = sanitizeLocalizedRecord(sourceSection.names, languages, 80)
      const itemsRaw = Array.isArray(sourceSection.items) ? sourceSection.items : []
      const items = itemsRaw
        .map((item) => {
          const sourceItem = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : null
          if (!sourceItem) return null

          const itemNames = sanitizeLocalizedRecord(sourceItem.names, languages, 120)
          const description = sanitizeLocalizedRecord(sourceItem.description, languages, 200)
          const price = String(sourceItem.price || '').trim().slice(0, 40)

          const hasAnyName = Object.values(itemNames).some(Boolean)
          if (!hasAnyName) return null

          return {
            names: itemNames,
            description,
            price,
          }
        })
        .filter((item): item is HotelMenuItem => Boolean(item))

      const hasSectionName = Object.values(names).some(Boolean)
      if (!key || !hasSectionName || items.length === 0) return null

      return {
        key,
        names,
        items,
      }
    })
    .filter((section): section is HotelMenuSection => Boolean(section))

  if (sections.length === 0) return null

  return {
    languages,
    sections,
  }
}

export function parseRoomServiceConfig(value: string | null | undefined): HotelRoomServiceConfig {
  if (!value) return DEFAULT_ROOM_SERVICE_CONFIG

  try {
    const parsed = JSON.parse(value)
    const validated = validateRoomServiceConfig(parsed)
    return validated || DEFAULT_ROOM_SERVICE_CONFIG
  } catch {
    return DEFAULT_ROOM_SERVICE_CONFIG
  }
}

export function validateRoomServiceConfig(input: unknown): HotelRoomServiceConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeMenuLanguages(src.languages)

  if (!Array.isArray(src.items)) return null
  const items = src.items
    .map((item) => {
      const source = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : null
      if (!source) return null

      const key = String(source.key || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24)

      const names = sanitizeLocalizedRecord(source.names, languages, 120)
      const price = String(source.price || '').trim().slice(0, 40)

      if (!key || !Object.values(names).some(Boolean)) return null
      return { key, names, price }
    })
    .filter((item): item is RoomServiceItem => Boolean(item))

  if (items.length === 0) return null
  return { languages, items }
}

export function parseServiceTicketConfig(value: string | null | undefined): HotelServiceTicketConfig {
  if (!value) return DEFAULT_SERVICE_TICKET_CONFIG

  try {
    const parsed = JSON.parse(value)
    const validated = validateServiceTicketConfig(parsed)
    return validated || DEFAULT_SERVICE_TICKET_CONFIG
  } catch {
    return DEFAULT_SERVICE_TICKET_CONFIG
  }
}

export function validateServiceTicketConfig(input: unknown): HotelServiceTicketConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeMenuLanguages(src.languages)

  if (!Array.isArray(src.categories)) return null
  const categories = src.categories
    .map((item) => {
      const source = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : null
      if (!source) return null

      const key = String(source.key || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24)

      const departmentRaw = String(source.department || '').trim().toLowerCase()
      const department =
        departmentRaw === 'technical'
          ? 'technical'
          : departmentRaw === 'housekeeping'
            ? 'housekeeping'
            : departmentRaw === 'concierge'
              ? 'concierge'
              : null
      const names = sanitizeLocalizedRecord(source.names, languages, 120)

      if (!key || !department || !Object.values(names).some(Boolean)) return null
      return { key, department, names }
    })
    .filter((item): item is ServiceTicketCategory => Boolean(item))

  if (categories.length === 0) return null
  return { languages, categories }
}

export function validateWorldClockCities(input: unknown): WorldClockCity[] | null {
  if (!Array.isArray(input)) return null

  const cities = input
    .map((item) => ({
      city: String((item as { city?: unknown })?.city || '').trim().slice(0, 64),
      timezone: String((item as { timezone?: unknown })?.timezone || '').trim().slice(0, 80),
    }))
    .filter((item) => item.city && item.timezone)

  return cities.length > 0 ? cities : null
}

export function normalizeHotelRole(input: unknown): HotelRole | null {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'platform_admin' || value === 'hotel_admin' || value === 'education_admin' || value === 'staff') {
    return value
  }
  return null
}
