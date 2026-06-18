export const EDUCATION_LANGUAGES = ['tr', 'en', 'de']

export interface EducationAttendanceConfig {
  languages: string[]
  classCode: string
  lessonName: string
  scheduledStart: string
  scheduledEnd: string
  parentNotificationEnabled: boolean
}

export interface EducationMaterialItem {
  key: string
  titles: Record<string, string>
  materialType: 'pdf' | 'video' | 'homework' | 'link'
  url: string
}

export interface EducationMaterialConfig {
  languages: string[]
  classCode: string
  lessonName: string
  items: EducationMaterialItem[]
}

export interface EducationQuizQuestion {
  key: string
  titles: Record<string, string>
  choices: Array<{ key: string; labels: Record<string, string>; isCorrect: boolean }>
}

export interface EducationQuizConfig {
  languages: string[]
  classCode: string
  lessonName: string
  dueAt: string
  questions: EducationQuizQuestion[]
}

export interface EducationAnnouncementConfig {
  languages: string[]
  classCode: string
  branchCode: string
  titles: Record<string, string>
  descriptions: Record<string, string>
  eventDate: string
  parentApprovalRequired: boolean
}

export interface EducationSupportCategory {
  key: string
  department: 'technical' | 'administrative'
  titles: Record<string, string>
}

export interface EducationSupportConfig {
  languages: string[]
  categories: EducationSupportCategory[]
}

export interface EducationParentTeacherConfig {
  languages: string[]
  classCode: string
  teachers: Array<{ key: string; names: Record<string, string> }>
}

export const DEFAULT_ATTENDANCE_CONFIG: EducationAttendanceConfig = {
  languages: EDUCATION_LANGUAGES,
  classCode: '9-A',
  lessonName: 'Matematik',
  scheduledStart: '09:00',
  scheduledEnd: '09:50',
  parentNotificationEnabled: false,
}

export const DEFAULT_MATERIAL_CONFIG: EducationMaterialConfig = {
  languages: EDUCATION_LANGUAGES,
  classCode: '9-A',
  lessonName: 'Matematik',
  items: [
    {
      key: 'lesson-notes-1',
      titles: { tr: 'Ders Notu 1', en: 'Lesson Notes 1', de: 'Unterrichtsnotiz 1' },
      materialType: 'pdf',
      url: 'https://example.com/material.pdf',
    },
  ],
}

export const DEFAULT_QUIZ_CONFIG: EducationQuizConfig = {
  languages: EDUCATION_LANGUAGES,
  classCode: '9-A',
  lessonName: 'Matematik',
  dueAt: '',
  questions: [
    {
      key: 'q1',
      titles: { tr: '2 + 2 kaçtır?', en: 'What is 2 + 2?', de: 'Was ist 2 + 2?' },
      choices: [
        { key: 'a', labels: { tr: '3', en: '3', de: '3' }, isCorrect: false },
        { key: 'b', labels: { tr: '4', en: '4', de: '4' }, isCorrect: true },
      ],
    },
  ],
}

export const DEFAULT_ANNOUNCEMENT_CONFIG: EducationAnnouncementConfig = {
  languages: EDUCATION_LANGUAGES,
  classCode: '9-A',
  branchCode: 'A',
  titles: {
    tr: 'Veli Toplantısı',
    en: 'Parent Meeting',
    de: 'Elternversammlung',
  },
  descriptions: {
    tr: 'Cuma günü saat 18:00 veli toplantısı yapılacaktır.',
    en: 'A parent meeting will be held on Friday at 18:00.',
    de: 'Am Freitag um 18:00 Uhr findet ein Elternabend statt.',
  },
  eventDate: '',
  parentApprovalRequired: true,
}

export const DEFAULT_SUPPORT_CONFIG: EducationSupportConfig = {
  languages: EDUCATION_LANGUAGES,
  categories: [
    { key: 'smart-board', department: 'technical', titles: { tr: 'Akıllı Tahta', en: 'Smart Board', de: 'Smartboard' } },
    { key: 'projector', department: 'technical', titles: { tr: 'Projeksiyon', en: 'Projector', de: 'Projektor' } },
    { key: 'document-request', department: 'administrative', titles: { tr: 'Belge Talebi', en: 'Document Request', de: 'Dokumentanfrage' } },
    { key: 'leave-request', department: 'administrative', titles: { tr: 'İzin Talebi', en: 'Leave Request', de: 'Urlaubsanfrage' } },
  ],
}

export const DEFAULT_PARENT_TEACHER_CONFIG: EducationParentTeacherConfig = {
  languages: EDUCATION_LANGUAGES,
  classCode: '9-A',
  teachers: [
    { key: 'math-teacher', names: { tr: 'Matematik Öğretmeni', en: 'Math Teacher', de: 'Mathelehrer' } },
  ],
}

function normalizeLanguages(input: unknown) {
  if (!Array.isArray(input)) return EDUCATION_LANGUAGES
  const normalized = input
    .map((lang) => String(lang || '').trim().toLowerCase().replace(/[^a-z-]/g, '').slice(0, 8))
    .filter(Boolean)
  return normalized.length > 0 ? Array.from(new Set(normalized)) : EDUCATION_LANGUAGES
}

function sanitizeLocalizedRecord(input: unknown, languages: string[], maxLen: number) {
  const source = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const out: Record<string, string> = {}
  for (const lang of languages) {
    out[lang] = String(source[lang] || '').trim().slice(0, maxLen)
  }
  return out
}

function normalizeKey(input: unknown, maxLen = 40) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen)
}

function normalizeClock(input: unknown) {
  const value = String(input || '').trim()
  if (!value) return ''
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}

export function parseAttendanceConfig(value: string | null | undefined): EducationAttendanceConfig {
  if (!value) return DEFAULT_ATTENDANCE_CONFIG
  try {
    const validated = validateAttendanceConfig(JSON.parse(value))
    return validated || DEFAULT_ATTENDANCE_CONFIG
  } catch {
    return DEFAULT_ATTENDANCE_CONFIG
  }
}

export function validateAttendanceConfig(input: unknown): EducationAttendanceConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeLanguages(src.languages)
  const classCode = String(src.classCode || '').trim().slice(0, 24)
  const lessonName = String(src.lessonName || '').trim().slice(0, 140)
  const scheduledStart = normalizeClock(src.scheduledStart)
  const scheduledEnd = normalizeClock(src.scheduledEnd)

  if (!classCode || !lessonName || !scheduledStart || !scheduledEnd) return null

  return {
    languages,
    classCode,
    lessonName,
    scheduledStart,
    scheduledEnd,
    parentNotificationEnabled: Boolean(src.parentNotificationEnabled),
  }
}

export function parseMaterialConfig(value: string | null | undefined): EducationMaterialConfig {
  if (!value) return DEFAULT_MATERIAL_CONFIG
  try {
    const validated = validateMaterialConfig(JSON.parse(value))
    return validated || DEFAULT_MATERIAL_CONFIG
  } catch {
    return DEFAULT_MATERIAL_CONFIG
  }
}

export function validateMaterialConfig(input: unknown): EducationMaterialConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeLanguages(src.languages)
  const classCode = String(src.classCode || '').trim().slice(0, 24)
  const lessonName = String(src.lessonName || '').trim().slice(0, 140)
  if (!classCode || !lessonName || !Array.isArray(src.items)) return null

  const items = src.items
    .map((item) => {
      const source = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : null
      if (!source) return null
      const key = normalizeKey(source.key)
      const titles = sanitizeLocalizedRecord(source.titles, languages, 140)
      const materialTypeRaw = String(source.materialType || '').trim().toLowerCase()
      const materialType =
        materialTypeRaw === 'video' ? 'video' : materialTypeRaw === 'homework' ? 'homework' : materialTypeRaw === 'link' ? 'link' : 'pdf'
      const url = String(source.url || '').trim().slice(0, 600)
      if (!key || !url || !Object.values(titles).some(Boolean)) return null
      return { key, titles, materialType, url }
    })
    .filter((item): item is EducationMaterialItem => Boolean(item))

  if (items.length === 0) return null
  return { languages, classCode, lessonName, items }
}

export function parseQuizConfig(value: string | null | undefined): EducationQuizConfig {
  if (!value) return DEFAULT_QUIZ_CONFIG
  try {
    const validated = validateQuizConfig(JSON.parse(value))
    return validated || DEFAULT_QUIZ_CONFIG
  } catch {
    return DEFAULT_QUIZ_CONFIG
  }
}

export function validateQuizConfig(input: unknown): EducationQuizConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeLanguages(src.languages)
  const classCode = String(src.classCode || '').trim().slice(0, 24)
  const lessonName = String(src.lessonName || '').trim().slice(0, 140)
  const dueAt = String(src.dueAt || '').trim().slice(0, 40)
  if (!classCode || !lessonName || !Array.isArray(src.questions)) return null

  const questions = src.questions
    .map((question) => {
      const source = typeof question === 'object' && question !== null ? (question as Record<string, unknown>) : null
      if (!source || !Array.isArray(source.choices)) return null

      const key = normalizeKey(source.key)
      const titles = sanitizeLocalizedRecord(source.titles, languages, 220)
      const choices = source.choices
        .map((choice) => {
          const c = typeof choice === 'object' && choice !== null ? (choice as Record<string, unknown>) : null
          if (!c) return null
          const choiceKey = normalizeKey(c.key, 12)
          const labels = sanitizeLocalizedRecord(c.labels, languages, 120)
          if (!choiceKey || !Object.values(labels).some(Boolean)) return null
          return {
            key: choiceKey,
            labels,
            isCorrect: Boolean(c.isCorrect),
          }
        })
        .filter((item): item is { key: string; labels: Record<string, string>; isCorrect: boolean } => Boolean(item))

      const correctCount = choices.filter((item) => item.isCorrect).length
      if (!key || !Object.values(titles).some(Boolean) || choices.length < 2 || correctCount !== 1) return null
      return { key, titles, choices }
    })
    .filter((item): item is EducationQuizQuestion => Boolean(item))

  if (questions.length === 0) return null
  return { languages, classCode, lessonName, dueAt, questions }
}

export function parseAnnouncementConfig(value: string | null | undefined): EducationAnnouncementConfig {
  if (!value) return DEFAULT_ANNOUNCEMENT_CONFIG
  try {
    const validated = validateAnnouncementConfig(JSON.parse(value))
    return validated || DEFAULT_ANNOUNCEMENT_CONFIG
  } catch {
    return DEFAULT_ANNOUNCEMENT_CONFIG
  }
}

export function validateAnnouncementConfig(input: unknown): EducationAnnouncementConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeLanguages(src.languages)
  const classCode = String(src.classCode || '').trim().slice(0, 24)
  const branchCode = String(src.branchCode || '').trim().slice(0, 24)
  const titles = sanitizeLocalizedRecord(src.titles, languages, 160)
  const descriptions = sanitizeLocalizedRecord(src.descriptions, languages, 600)
  const eventDate = String(src.eventDate || '').trim().slice(0, 40)

  if (!classCode || !branchCode || !Object.values(titles).some(Boolean) || !Object.values(descriptions).some(Boolean)) return null

  return {
    languages,
    classCode,
    branchCode,
    titles,
    descriptions,
    eventDate,
    parentApprovalRequired: Boolean(src.parentApprovalRequired),
  }
}

export function parseSupportConfig(value: string | null | undefined): EducationSupportConfig {
  if (!value) return DEFAULT_SUPPORT_CONFIG
  try {
    const validated = validateSupportConfig(JSON.parse(value))
    return validated || DEFAULT_SUPPORT_CONFIG
  } catch {
    return DEFAULT_SUPPORT_CONFIG
  }
}

export function validateSupportConfig(input: unknown): EducationSupportConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeLanguages(src.languages)
  if (!Array.isArray(src.categories)) return null

  const categories = src.categories
    .map((category) => {
      const source = typeof category === 'object' && category !== null ? (category as Record<string, unknown>) : null
      if (!source) return null
      const key = normalizeKey(source.key)
      const departmentRaw = String(source.department || '').trim().toLowerCase()
      const department = departmentRaw === 'technical' ? 'technical' : departmentRaw === 'administrative' ? 'administrative' : null
      const titles = sanitizeLocalizedRecord(source.titles, languages, 120)
      if (!key || !department || !Object.values(titles).some(Boolean)) return null
      return { key, department, titles }
    })
    .filter((item): item is EducationSupportCategory => Boolean(item))

  if (categories.length === 0) return null
  return { languages, categories }
}

export function parseParentTeacherConfig(value: string | null | undefined): EducationParentTeacherConfig {
  if (!value) return DEFAULT_PARENT_TEACHER_CONFIG
  try {
    const validated = validateParentTeacherConfig(JSON.parse(value))
    return validated || DEFAULT_PARENT_TEACHER_CONFIG
  } catch {
    return DEFAULT_PARENT_TEACHER_CONFIG
  }
}

export function validateParentTeacherConfig(input: unknown): EducationParentTeacherConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const src = input as Record<string, unknown>
  const languages = normalizeLanguages(src.languages)
  const classCode = String(src.classCode || '').trim().slice(0, 24)
  if (!classCode || !Array.isArray(src.teachers)) return null

  const teachers = src.teachers
    .map((teacher) => {
      const source = typeof teacher === 'object' && teacher !== null ? (teacher as Record<string, unknown>) : null
      if (!source) return null
      const key = normalizeKey(source.key)
      const names = sanitizeLocalizedRecord(source.names, languages, 120)
      if (!key || !Object.values(names).some(Boolean)) return null
      return { key, names }
    })
    .filter((item): item is { key: string; names: Record<string, string> } => Boolean(item))

  if (teachers.length === 0) return null
  return { languages, classCode, teachers }
}

export type EducationModuleType =
  | 'class_attendance'
  | 'lesson_material'
  | 'homework_quiz'
  | 'announcement_event'
  | 'education_support_ticket'
  | 'parent_teacher_meeting'

export function validateEducationConfigByType(moduleType: EducationModuleType, input: unknown) {
  if (moduleType === 'class_attendance') return validateAttendanceConfig(input)
  if (moduleType === 'lesson_material') return validateMaterialConfig(input)
  if (moduleType === 'homework_quiz') return validateQuizConfig(input)
  if (moduleType === 'announcement_event') return validateAnnouncementConfig(input)
  if (moduleType === 'education_support_ticket') return validateSupportConfig(input)
  return validateParentTeacherConfig(input)
}
