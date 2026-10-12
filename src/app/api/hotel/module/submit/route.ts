import { NextRequest, NextResponse } from 'next/server'
import { validateAudioFile } from '@/lib/audio'
import { putBlob } from '@/lib/blob'
import { ensureQrSchema, sql } from '@/lib/db'
import { buildManualWhatsAppLink, notifyHotelOpsOnWhatsApp } from '@/lib/hotelNotify'
import { parseRoomServiceConfig, parseServiceTicketConfig } from '@/lib/hotel'
import {
  parseAnnouncementConfig,
  parseAttendanceConfig,
  parseMaterialConfig,
  parseParentTeacherConfig,
  parseQuizConfig,
  parseSupportConfig,
} from '@/lib/education'

function normalizeRoomNo(input: unknown) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20)
}

function normalizeGuestName(input: unknown) {
  return String(input || '').trim().slice(0, 120)
}

function normalizeLanguage(input: unknown) {
  const value = String(input || '').trim().toLowerCase().slice(0, 8)
  return value || 'tr'
}

function normalizePhone(input: unknown) {
  return String(input || '').replace(/[^0-9+]/g, '').slice(0, 30)
}

function normalizeStudentNo(input: unknown) {
  return String(input || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32)
}

function normalizeStudentName(input: unknown) {
  return String(input || '').trim().slice(0, 120)
}

function parseClockToMinutes(clock: string) {
  const match = String(clock || '').trim().match(/^(\d{2}):(\d{2})$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function normalizeFloorLabel(input: unknown) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20)
}

function normalizeSourceTag(input: unknown) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
    .slice(0, 64)
}

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const contentType = String(req.headers.get('content-type') || '').toLowerCase()
    let body: Record<string, unknown> = {}
    let voiceNoteFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const itemsRaw = String(formData.get('items') || '[]')
      let parsedItems: unknown = []
      try {
        parsedItems = JSON.parse(itemsRaw)
      } catch {
        parsedItems = []
      }

      body = {
        hotelCode: String(formData.get('hotelCode') || ''),
        slug: String(formData.get('slug') || ''),
        roomNo: String(formData.get('roomNo') || ''),
        floorLabel: String(formData.get('floorLabel') || ''),
        sourceTag: String(formData.get('sourceTag') || ''),
        guestName: String(formData.get('guestName') || ''),
        lang: String(formData.get('lang') || ''),
        notes: String(formData.get('notes') || ''),
        items: parsedItems,
        contactPhone: String(formData.get('contactPhone') || ''),
        requestedTime: String(formData.get('requestedTime') || ''),
        categoryKey: String(formData.get('categoryKey') || ''),
        priority: String(formData.get('priority') || ''),
        details: String(formData.get('details') || ''),
        studentNo: String(formData.get('studentNo') || ''),
        studentName: String(formData.get('studentName') || ''),
        parentPhone: String(formData.get('parentPhone') || ''),
        scanTime: String(formData.get('scanTime') || ''),
        notifyParent: String(formData.get('notifyParent') || ''),
        materialKey: String(formData.get('materialKey') || ''),
        teacherKey: String(formData.get('teacherKey') || ''),
        eventResponse: String(formData.get('eventResponse') || ''),
        parentName: String(formData.get('parentName') || ''),
        requesterRole: String(formData.get('requesterRole') || ''),
        answers: String(formData.get('answers') || ''),
      }

      const maybeVoiceNote = formData.get('voiceNote')
      voiceNoteFile = maybeVoiceNote instanceof File && maybeVoiceNote.size > 0 ? maybeVoiceNote : null
    } else {
      body = await req.json().catch(() => ({}))
    }

    const hotelCode = String(body.hotelCode || '').trim().toUpperCase()
    const slug = String(body.slug || '').trim().toLowerCase()
    const roomNo = normalizeRoomNo(body.roomNo)
    const floorLabel = normalizeFloorLabel(body.floorLabel)
    const sourceTag = normalizeSourceTag(body.sourceTag) || `${floorLabel ? `F${floorLabel}-` : ''}R${roomNo}`
    const guestName = normalizeGuestName(body.guestName)
    const lang = normalizeLanguage(body.lang)

    if (!hotelCode || !slug) {
      return NextResponse.json({ error: 'hotelCode ve slug gerekli' }, { status: 400 })
    }

    const moduleRows = await sql`
      SELECT m.id, m.module_type, m.config_json, h.id AS hotel_id, h.name AS hotel_name, h.code AS hotel_code, h.whatsapp_number
      FROM hotel_qr_modules m
      JOIN hotel_tenants h ON h.id = m.hotel_id
      WHERE h.code = ${hotelCode}
        AND h.is_active = TRUE
        AND m.slug = ${slug}
        AND m.is_active = TRUE
      LIMIT 1
    `

    if (moduleRows.length === 0) {
      return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
    }

    const moduleRow = moduleRows[0]
    const moduleType = String(moduleRow.module_type || '')

    let voiceNoteUrl = ''
    if (voiceNoteFile) {
      const audioValidationError = await validateAudioFile(voiceNoteFile)
      if (audioValidationError) {
        return NextResponse.json({ error: audioValidationError }, { status: 400 })
      }

      const ext = voiceNoteFile.name.split('.').pop() || 'webm'
      const safeSlug = slug.replace(/[^a-z0-9-]/g, '') || 'module'
      const blob = await putBlob(`hotel-ops/${hotelCode}/${safeSlug}/${Date.now()}.${ext}`, voiceNoteFile)
      voiceNoteUrl = String(blob.url || '')
    }

    if (moduleType === 'room_service') {
      if (!roomNo) {
        return NextResponse.json({ error: 'roomNo gerekli' }, { status: 400 })
      }
      const config = parseRoomServiceConfig(String(moduleRow.config_json || '{}'))
      const requestedItems = Array.isArray(body.items)
        ? body.items
            .map((item: unknown) => ({
              key: String((item as { key?: unknown })?.key || '').trim(),
              quantity: Math.max(1, Math.min(20, Number((item as { quantity?: unknown })?.quantity) || 1)),
            }))
            .filter((item: { key: string; quantity: number }) => item.key)
        : []

      if (requestedItems.length === 0) {
        return NextResponse.json({ error: 'En az bir ürün seçmelisin' }, { status: 400 })
      }

      const catalogMap = new Map(config.items.map((item: (typeof config.items)[number]) => [item.key, item]))
      const normalizedItems = requestedItems
        .map((item: { key: string; quantity: number }) => {
          const catalogItem = catalogMap.get(item.key)
          if (!catalogItem) return null
          return {
            key: item.key,
            quantity: item.quantity,
            name: catalogItem.names[lang] || catalogItem.names.en || catalogItem.names.tr || item.key,
            price: catalogItem.price || '',
          }
        })
        .filter((item: unknown): item is { key: string; quantity: number; name: string; price: string } => Boolean(item))

      if (normalizedItems.length === 0) {
        return NextResponse.json({ error: 'Seçilen ürünler geçersiz' }, { status: 400 })
      }

      const notes = String(body.notes || '').trim().slice(0, 600)
      const itemsJson = JSON.stringify(normalizedItems)

      const insertRows = await sql`
        INSERT INTO hotel_room_orders (hotel_id, module_id, room_no, floor_label, source_tag, guest_name, lang, items_json, notes, voice_note_url, status, whatsapp_delivery)
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${roomNo},
          ${floorLabel},
          ${sourceTag},
          ${guestName},
          ${lang},
          ${itemsJson},
          ${notes},
          ${voiceNoteUrl},
          'new',
          'pending'
        )
        RETURNING id, created_at
      `

      const orderId = String(insertRows[0]?.id || '')
      const voiceListenUrl = voiceNoteUrl ? `${req.nextUrl.origin}/api/hotel/ops/audio/room-order/${orderId}` : ''
      const summaryText = normalizedItems.map((item: { name: string; quantity: number }) => `${item.name} x${item.quantity}`).join(', ')
      const message = [
        `Yeni Oda Servisi Siparişi`,
        `Otel: ${String(moduleRow.hotel_name || '')} (${String(moduleRow.hotel_code || '')})`,
        `Oda: ${roomNo}`,
        `Kat: ${floorLabel || '-'}`,
        `QR Kaynağı: ${sourceTag}`,
        `Misafir: ${guestName || '-'}`,
        `Urunler: ${summaryText}`,
        `Not: ${notes || '-'}`,
        `Ses Notu: ${voiceListenUrl || '-'}`,
        `Kayit: ${orderId}`,
      ].join('\n')

      const notify = await notifyHotelOpsOnWhatsApp(message, String(moduleRow.whatsapp_number || ''))
      await sql`
        UPDATE hotel_room_orders
        SET whatsapp_delivery = ${notify.status}, updated_at = NOW()
        WHERE id = ${orderId}
      `

      return NextResponse.json({
        ok: true,
        kind: 'room_service',
        orderId,
        whatsappDelivery: notify.status,
        whatsappDetail: notify.detail || null,
        voiceListenUrl: voiceListenUrl || null,
        manualWhatsAppUrl: buildManualWhatsAppLink(message, String(moduleRow.whatsapp_number || '')),
      })
    }

    if (moduleType === 'service_ticket') {
      if (!roomNo) {
        return NextResponse.json({ error: 'roomNo gerekli' }, { status: 400 })
      }
      const config = parseServiceTicketConfig(String(moduleRow.config_json || '{}'))
      const categoryKey = String(body.categoryKey || '').trim()
      const category = config.categories.find((item) => item.key === categoryKey)
      if (!category) {
        return NextResponse.json({ error: 'Geçerli bir kategori seç' }, { status: 400 })
      }

      const priorityRaw = String(body.priority || '').trim().toLowerCase()
      const priority = priorityRaw === 'urgent' || priorityRaw === 'high' || priorityRaw === 'low' ? priorityRaw : 'normal'
      const details = String(body.details || '').trim().slice(0, 700)
      const contactPhone = normalizePhone(body.contactPhone)
      const requestedTime = String(body.requestedTime || '').trim().slice(0, 40)

      if (!details) {
        return NextResponse.json({ error: 'Talep detayı gerekli' }, { status: 400 })
      }

      const insertRows = await sql`
        INSERT INTO hotel_service_tickets (hotel_id, module_id, room_no, floor_label, source_tag, guest_name, contact_phone, requested_time, lang, department, category, priority, details, voice_note_url, status, whatsapp_delivery)
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${roomNo},
          ${floorLabel},
          ${sourceTag},
          ${guestName},
          ${contactPhone},
          ${requestedTime},
          ${lang},
          ${category.department},
          ${category.key},
          ${priority},
          ${details},
          ${voiceNoteUrl},
          'new',
          'pending'
        )
        RETURNING id, created_at
      `

      const ticketId = String(insertRows[0]?.id || '')
      const voiceListenUrl = voiceNoteUrl ? `${req.nextUrl.origin}/api/hotel/ops/audio/service-ticket/${ticketId}` : ''
      const categoryName = category.names[lang] || category.names.en || category.names.tr || category.key
      const message = [
        `Yeni Servis Talebi`,
        `Otel: ${String(moduleRow.hotel_name || '')} (${String(moduleRow.hotel_code || '')})`,
        `Oda: ${roomNo}`,
        `Kat: ${floorLabel || '-'}`,
        `QR Kaynağı: ${sourceTag}`,
        `Misafir: ${guestName || '-'}`,
        `İletişim: ${contactPhone || '-'}`,
        `İstenen Zaman: ${requestedTime || 'En kısa sürede'}`,
        `Departman: ${category.department}`,
        `Kategori: ${categoryName}`,
        `Öncelik: ${priority}`,
        `Detay: ${details}`,
        `Ses Notu: ${voiceListenUrl || '-'}`,
        `Kayit: ${ticketId}`,
      ].join('\n')

      const notify = await notifyHotelOpsOnWhatsApp(message, String(moduleRow.whatsapp_number || ''))
      await sql`
        UPDATE hotel_service_tickets
        SET whatsapp_delivery = ${notify.status}, updated_at = NOW()
        WHERE id = ${ticketId}
      `

      return NextResponse.json({
        ok: true,
        kind: 'service_ticket',
        ticketId,
        whatsappDelivery: notify.status,
        whatsappDetail: notify.detail || null,
        voiceListenUrl: voiceListenUrl || null,
        manualWhatsAppUrl: buildManualWhatsAppLink(message, String(moduleRow.whatsapp_number || '')),
      })
    }

    if (moduleType === 'class_attendance') {
      const config = parseAttendanceConfig(String(moduleRow.config_json || '{}'))
      const studentNo = normalizeStudentNo(body.studentNo)
      const studentName = normalizeStudentName(body.studentName)
      const parentPhone = normalizePhone(body.parentPhone)
      const scanTimeRaw = String(body.scanTime || '').trim()
      const scanTime = scanTimeRaw || new Date().toTimeString().slice(0, 5)
      const notifyParent = String(body.notifyParent || '').trim().toLowerCase() === 'true'

      if (!studentNo || !studentName) {
        return NextResponse.json({ error: 'Öğrenci no ve adı gerekli' }, { status: 400 })
      }

      const scanMinutes = parseClockToMinutes(scanTime)
      const startMinutes = parseClockToMinutes(config.scheduledStart)
      const endMinutes = parseClockToMinutes(config.scheduledEnd)
      if (scanMinutes === null || startMinutes === null || endMinutes === null) {
        return NextResponse.json({ error: 'Saat formatı geçersiz' }, { status: 400 })
      }

      let entryStatus: 'on_time' | 'late' | 'early_leave' = 'on_time'
      let lateMinutes = 0
      let earlyLeaveMinutes = 0
      if (scanMinutes > startMinutes) {
        entryStatus = 'late'
        lateMinutes = scanMinutes - startMinutes
      }
      if (scanMinutes < endMinutes - 10) {
        entryStatus = 'early_leave'
        earlyLeaveMinutes = endMinutes - scanMinutes
      }

      const rows = await sql`
        INSERT INTO education_attendance_logs (
          hotel_id, module_id, class_code, lesson_name, student_no, student_name, parent_phone, lang,
          scheduled_start, scheduled_end, scanned_at, entry_status, late_minutes, early_leave_minutes,
          notify_parent, whatsapp_delivery
        )
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${config.classCode},
          ${config.lessonName},
          ${studentNo},
          ${studentName},
          ${parentPhone},
          ${lang},
          ${config.scheduledStart},
          ${config.scheduledEnd},
          NOW(),
          ${entryStatus},
          ${lateMinutes},
          ${earlyLeaveMinutes},
          ${notifyParent && config.parentNotificationEnabled},
          'pending'
        )
        RETURNING id
      `

      const attendanceId = String(rows[0]?.id || '')
      let whatsappDelivery: 'sent' | 'failed' | 'skipped' = 'skipped'
      let whatsappDetail: string | null = null
      let manualWhatsAppUrl: string | null = null

      if (notifyParent && config.parentNotificationEnabled && parentPhone) {
        const parentMessage = [
          `Yoklama bildirimi`,
          `Okul: ${String(moduleRow.hotel_name || '')}`,
          `Sınıf: ${config.classCode}`,
          `Ders: ${config.lessonName}`,
          `Öğrenci: ${studentName} (${studentNo})`,
          `Durum: ${entryStatus === 'late' ? `Geç (${lateMinutes} dk)` : entryStatus === 'early_leave' ? `Erken çıkış (${earlyLeaveMinutes} dk)` : 'Zamanında'}`,
          `Kayıt: ${attendanceId}`,
        ].join('\n')

        const notify = await notifyHotelOpsOnWhatsApp(parentMessage, parentPhone)
        whatsappDelivery = notify.status
        whatsappDetail = notify.detail || null
        manualWhatsAppUrl = buildManualWhatsAppLink(parentMessage, parentPhone)

        await sql`
          UPDATE education_attendance_logs
          SET whatsapp_delivery = ${notify.status}
          WHERE id = ${attendanceId}
        `
      }

      return NextResponse.json({
        ok: true,
        kind: 'class_attendance',
        attendanceId,
        entryStatus,
        lateMinutes,
        earlyLeaveMinutes,
        whatsappDelivery,
        whatsappDetail,
        manualWhatsAppUrl,
      })
    }

    if (moduleType === 'lesson_material') {
      const config = parseMaterialConfig(String(moduleRow.config_json || '{}'))
      const materialKey = String(body.materialKey || '').trim()
      const studentNo = normalizeStudentNo(body.studentNo)
      const studentName = normalizeStudentName(body.studentName)

      const material = config.items.find((item) => item.key === materialKey)
      if (!material) {
        return NextResponse.json({ error: 'Geçerli bir materyal seç' }, { status: 400 })
      }

      await sql`
        INSERT INTO education_material_events (hotel_id, module_id, class_code, lesson_name, material_key, student_no, student_name, lang)
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${config.classCode},
          ${config.lessonName},
          ${material.key},
          ${studentNo},
          ${studentName},
          ${lang}
        )
      `

      return NextResponse.json({ ok: true, kind: 'lesson_material', materialUrl: material.url })
    }

    if (moduleType === 'homework_quiz') {
      const config = parseQuizConfig(String(moduleRow.config_json || '{}'))
      const studentNo = normalizeStudentNo(body.studentNo)
      const studentName = normalizeStudentName(body.studentName)
      const answersRaw = String(body.answers || '')
      let answers: Record<string, string> = {}
      try {
        answers = JSON.parse(answersRaw || '{}') as Record<string, string>
      } catch {
        answers = {}
      }

      if (!studentNo || !studentName) {
        return NextResponse.json({ error: 'Öğrenci no ve adı gerekli' }, { status: 400 })
      }

      // If dueAt is configured as a valid date, reject late submissions.
      const dueAtRaw = String(config.dueAt || '').trim()
      if (dueAtRaw) {
        const dueAtDate = new Date(dueAtRaw)
        if (!Number.isNaN(dueAtDate.getTime()) && Date.now() > dueAtDate.getTime()) {
          return NextResponse.json({ error: 'Bu quiz için son tarih doldu' }, { status: 403 })
        }
      }

      let score = 0
      for (const question of config.questions) {
        const selected = String(answers[question.key] || '')
        const correct = question.choices.find((choice) => choice.isCorrect)
        if (correct && selected === correct.key) score += 1
      }

      const totalQuestions = config.questions.length
      const row = await sql`
        INSERT INTO education_quiz_submissions (
          hotel_id, module_id, class_code, lesson_name, student_no, student_name, lang, answers_json, score, total_questions, due_at
        )
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${config.classCode},
          ${config.lessonName},
          ${studentNo},
          ${studentName},
          ${lang},
          ${JSON.stringify(answers)},
          ${score},
          ${totalQuestions},
          ${config.dueAt}
        )
        RETURNING id
      `

      return NextResponse.json({
        ok: true,
        kind: 'homework_quiz',
        submissionId: String(row[0]?.id || ''),
        score,
        totalQuestions,
        percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
      })
    }

    if (moduleType === 'announcement_event') {
      const config = parseAnnouncementConfig(String(moduleRow.config_json || '{}'))
      const studentNo = normalizeStudentNo(body.studentNo)
      const studentName = normalizeStudentName(body.studentName)
      const parentName = normalizeStudentName(body.parentName)
      const parentPhone = normalizePhone(body.parentPhone)
      const eventResponse = String(body.eventResponse || '').trim().toLowerCase()
      const response = eventResponse === 'declined' ? 'declined' : 'accepted'
      const notes = String(body.notes || '').trim().slice(0, 800)

      if (!studentNo || !studentName) {
        return NextResponse.json({ error: 'Öğrenci no ve adı gerekli' }, { status: 400 })
      }

      const row = await sql`
        INSERT INTO education_announcement_responses (
          hotel_id, module_id, class_code, branch_code, student_no, student_name, parent_name, parent_phone,
          event_response, needs_approval, approval_status, notes, lang
        )
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${config.classCode},
          ${config.branchCode},
          ${studentNo},
          ${studentName},
          ${parentName},
          ${parentPhone},
          ${response},
          ${config.parentApprovalRequired},
          ${config.parentApprovalRequired ? 'pending' : 'approved'},
          ${notes},
          ${lang}
        )
        RETURNING id
      `

      return NextResponse.json({ ok: true, kind: 'announcement_event', responseId: String(row[0]?.id || '') })
    }

    if (moduleType === 'education_support_ticket') {
      const config = parseSupportConfig(String(moduleRow.config_json || '{}'))
      const requesterName = normalizeStudentName(body.guestName || body.studentName)
      const requesterRole = String(body.requesterRole || 'teacher').trim().toLowerCase().slice(0, 24)
      const categoryKey = String(body.categoryKey || '').trim()
      const category = config.categories.find((item) => item.key === categoryKey)
      const priorityRaw = String(body.priority || '').trim().toLowerCase()
      const priority = priorityRaw === 'urgent' || priorityRaw === 'high' || priorityRaw === 'low' ? priorityRaw : 'normal'
      const details = String(body.details || '').trim().slice(0, 900)
      const contactPhone = normalizePhone(body.contactPhone)

      if (!requesterName || !category || !details) {
        return NextResponse.json({ error: 'Ad, kategori ve detay gerekli' }, { status: 400 })
      }

      const row = await sql`
        INSERT INTO education_support_tickets (
          hotel_id, module_id, requester_name, requester_role, class_code, department,
          category, priority, contact_phone, details, status, whatsapp_delivery, lang
        )
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${requesterName},
          ${requesterRole},
          '',
          ${category.department},
          ${category.key},
          ${priority},
          ${contactPhone},
          ${details},
          'new',
          'pending',
          ${lang}
        )
        RETURNING id
      `

      const ticketId = String(row[0]?.id || '')
      const message = [
        `Yeni Eğitim Destek Talebi`,
        `Kurum: ${String(moduleRow.hotel_name || '')} (${String(moduleRow.hotel_code || '')})`,
        `Talep Sahibi: ${requesterName} (${requesterRole})`,
        `Departman: ${category.department}`,
        `Kategori: ${category.key}`,
        `Öncelik: ${priority}`,
        `İletişim: ${contactPhone || '-'}`,
        `Detay: ${details}`,
        `Kayıt: ${ticketId}`,
      ].join('\n')

      const notify = await notifyHotelOpsOnWhatsApp(message, String(moduleRow.whatsapp_number || ''))
      await sql`
        UPDATE education_support_tickets
        SET whatsapp_delivery = ${notify.status}, updated_at = NOW()
        WHERE id = ${ticketId}
      `

      return NextResponse.json({
        ok: true,
        kind: 'education_support_ticket',
        ticketId,
        whatsappDelivery: notify.status,
        whatsappDetail: notify.detail || null,
        manualWhatsAppUrl: buildManualWhatsAppLink(message, String(moduleRow.whatsapp_number || '')),
      })
    }

    if (moduleType === 'parent_teacher_meeting') {
      const config = parseParentTeacherConfig(String(moduleRow.config_json || '{}'))
      const studentNo = normalizeStudentNo(body.studentNo)
      const studentName = normalizeStudentName(body.studentName)
      const parentName = normalizeStudentName(body.parentName)
      const parentPhone = normalizePhone(body.parentPhone)
      const teacherKey = String(body.teacherKey || '').trim()
      const teacher = config.teachers.find((item) => item.key === teacherKey)
      const requestedTime = String(body.requestedTime || '').trim().slice(0, 40)
      const notes = String(body.notes || '').trim().slice(0, 900)

      if (!studentNo || !studentName || !parentName || !teacher || !requestedTime) {
        return NextResponse.json({ error: 'Öğrenci, veli, öğretmen ve zaman gerekli' }, { status: 400 })
      }

      const row = await sql`
        INSERT INTO education_parent_teacher_meetings (
          hotel_id, module_id, class_code, student_no, student_name, parent_name, parent_phone,
          teacher_key, requested_time, notes, status, whatsapp_delivery, lang
        )
        VALUES (
          ${String(moduleRow.hotel_id || '')},
          ${String(moduleRow.id || '')},
          ${config.classCode},
          ${studentNo},
          ${studentName},
          ${parentName},
          ${parentPhone},
          ${teacher.key},
          ${requestedTime},
          ${notes},
          'new',
          'pending',
          ${lang}
        )
        RETURNING id
      `

      const meetingId = String(row[0]?.id || '')
      const teacherLabel = teacher.names[lang] || teacher.names.en || teacher.names.tr || teacher.key
      const message = [
        `Yeni Veli-Öğretmen Randevu Talebi`,
        `Kurum: ${String(moduleRow.hotel_name || '')} (${String(moduleRow.hotel_code || '')})`,
        `Sınıf: ${config.classCode}`,
        `Öğrenci: ${studentName} (${studentNo})`,
        `Veli: ${parentName}`,
        `Telefon: ${parentPhone || '-'}`,
        `Öğretmen: ${teacherLabel}`,
        `Zaman: ${requestedTime}`,
        `Not: ${notes || '-'}`,
        `Kayıt: ${meetingId}`,
      ].join('\n')

      const notify = await notifyHotelOpsOnWhatsApp(message, String(moduleRow.whatsapp_number || ''))
      await sql`
        UPDATE education_parent_teacher_meetings
        SET whatsapp_delivery = ${notify.status}, updated_at = NOW()
        WHERE id = ${meetingId}
      `

      return NextResponse.json({
        ok: true,
        kind: 'parent_teacher_meeting',
        meetingId,
        whatsappDelivery: notify.status,
        whatsappDetail: notify.detail || null,
        manualWhatsAppUrl: buildManualWhatsAppLink(message, String(moduleRow.whatsapp_number || '')),
      })
    }

    return NextResponse.json({ error: 'Bu modülde form gönderimi desteklenmiyor' }, { status: 400 })
  } catch (err) {
    console.error('[hotel/module/submit]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
