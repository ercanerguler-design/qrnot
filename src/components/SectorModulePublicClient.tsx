'use client'

import { useState } from 'react'
import type { SectorKey } from '@/lib/sectorPlatform'

interface Props {
  sector: SectorKey
  tenantCode: string
  tenantName: string
  moduleSlug: string
  moduleType: string
  moduleTitle: string
}

const SECTOR_LABEL: Record<SectorKey, string> = {
  health: 'Saglik',
  factory: 'Fabrika',
  retail: 'Perakende',
  logistics: 'Lojistik',
}

const SECTOR_THEME: Record<SectorKey, {
  shell: string
  card: string
  badge: string
  focus: string
  button: string
  patternA: string
  patternB: string
  iconSet: string[]
}> = {
  health: {
    shell: 'bg-gradient-to-b from-cyan-950/45 via-blue-950/25 to-neutral-950',
    card: 'border-cyan-500/35 bg-cyan-950/18',
    badge: 'text-cyan-200',
    focus: 'focus:border-cyan-400',
    button: 'bg-cyan-600 hover:bg-cyan-500',
    patternA: 'from-cyan-400/20 via-blue-400/10 to-transparent',
    patternB: 'from-emerald-300/20 via-cyan-300/10 to-transparent',
    iconSet: ['🏥', '🧪', '💉', '🧬'],
  },
  factory: {
    shell: 'bg-gradient-to-b from-amber-950/45 via-orange-950/25 to-neutral-950',
    card: 'border-amber-500/35 bg-amber-950/18',
    badge: 'text-amber-200',
    focus: 'focus:border-amber-400',
    button: 'bg-amber-600 hover:bg-amber-500',
    patternA: 'from-amber-400/20 via-orange-400/10 to-transparent',
    patternB: 'from-yellow-300/20 via-amber-300/10 to-transparent',
    iconSet: ['🏭', '⚙️', '🔧', '📦'],
  },
  retail: {
    shell: 'bg-gradient-to-b from-pink-950/45 via-rose-950/25 to-neutral-950',
    card: 'border-pink-500/35 bg-pink-950/18',
    badge: 'text-pink-200',
    focus: 'focus:border-pink-400',
    button: 'bg-pink-600 hover:bg-pink-500',
    patternA: 'from-pink-400/20 via-rose-400/10 to-transparent',
    patternB: 'from-fuchsia-300/20 via-rose-300/10 to-transparent',
    iconSet: ['🛍️', '🏷️', '🛒', '💳'],
  },
  logistics: {
    shell: 'bg-gradient-to-b from-cyan-950/45 via-lime-950/20 to-neutral-950',
    card: 'border-cyan-500/35 bg-cyan-950/18',
    badge: 'text-lime-200',
    focus: 'focus:border-cyan-400',
    button: 'bg-lime-600 hover:bg-lime-500 text-neutral-950',
    patternA: 'from-cyan-400/20 via-lime-400/10 to-transparent',
    patternB: 'from-lime-300/20 via-cyan-300/10 to-transparent',
    iconSet: ['🚚', '📦', '🛰️', '🧭'],
  },
}

interface FormField {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select' | 'datetime-local'
  required?: boolean
  placeholder?: string
  options?: string[]
}

function getFormSpec(moduleType: string): { intro: string; fields: FormField[] } {
  if (moduleType === 'patient_intake') {
    return {
      intro: 'Hasta kabul ve ilk kayıt formu',
      fields: [
        { key: 'patientCode', label: 'Hasta Kodu', type: 'text', required: true, placeholder: 'HN-000124' },
        { key: 'tcNo', label: 'T.C. Kimlik No', type: 'text', placeholder: '11 haneli numara' },
        { key: 'department', label: 'Birim', type: 'select', options: ['Acil', 'Poliklinik', 'Yatis'], required: true },
        { key: 'complaint', label: 'Basvuru Sikayeti', type: 'textarea', required: true, placeholder: 'Temel sikayet bilgisi' },
      ],
    }
  }
  if (moduleType === 'triage_flow') {
    return {
      intro: 'Triage ve aciliyet degerlendirme formu',
      fields: [
        { key: 'priority', label: 'Oncelik Seviyesi', type: 'select', options: ['Kirmizi', 'Sari', 'Yesil'], required: true },
        { key: 'pulse', label: 'Nabiz', type: 'number', placeholder: 'bpm' },
        { key: 'temperature', label: 'Ates', type: 'number', placeholder: 'Celsius' },
        { key: 'vitals', label: 'Vital Bulgular', type: 'textarea', required: true, placeholder: 'Tansiyon, nabiz, ates...' },
      ],
    }
  }
  if (moduleType === 'lab_result') {
    return {
      intro: 'Laboratuvar sonuc bildirim formu',
      fields: [
        { key: 'testPanel', label: 'Test Paneli', type: 'text', required: true, placeholder: 'Hemogram / Biyokimya...' },
        { key: 'sampleNo', label: 'Numune No', type: 'text', required: true, placeholder: 'LAB-2026-0001' },
        { key: 'criticalFlag', label: 'Kritik Sonuc', type: 'select', options: ['Hayir', 'Evet'], required: true },
        { key: 'resultSummary', label: 'Sonuc Ozeti', type: 'textarea', required: true, placeholder: 'Referans disi degerler ve yorum' },
      ],
    }
  }
  if (moduleType === 'imaging_link') {
    return {
      intro: 'Radyoloji sonuc baglanti formu',
      fields: [
        { key: 'imagingType', label: 'Goruntuleme Tipi', type: 'select', options: ['MR', 'BT', 'X-Ray', 'USG'], required: true },
        { key: 'accessUrl', label: 'PACS / Sonuc Linki', type: 'text', required: true, placeholder: 'https://...' },
        { key: 'radiologistNote', label: 'Radyolog Notu', type: 'textarea', required: true, placeholder: 'Klinik onemli bulgular' },
      ],
    }
  }
  if (moduleType === 'medication_instruction') {
    return {
      intro: 'Ilac kullanim rehberi formu',
      fields: [
        { key: 'medicationName', label: 'Ilac Adi', type: 'text', required: true, placeholder: 'Paracetamol 500 mg' },
        { key: 'dosage', label: 'Doz / Siklik', type: 'text', required: true, placeholder: '1x2 tok' },
        { key: 'duration', label: 'Tedavi Suresi', type: 'text', required: true, placeholder: '5 gun' },
        { key: 'warning', label: 'Uyari ve Yan Etki Notu', type: 'textarea', placeholder: 'Dikkat edilmesi gerekenler' },
      ],
    }
  }
  if (moduleType === 'device_instruction') {
    return {
      intro: 'Tibbi cihaz kullanim kilavuzu formu',
      fields: [
        { key: 'deviceName', label: 'Cihaz Adi', type: 'text', required: true, placeholder: 'Nebulizator / Insulin Pompa' },
        { key: 'serialNo', label: 'Seri No', type: 'text', placeholder: 'SN-...' },
        { key: 'stepSummary', label: 'Kullanim Adimlari', type: 'textarea', required: true, placeholder: 'Adim adim kullanim tarifi' },
        { key: 'safetyChecks', label: 'Guvenlik Kontrolu', type: 'textarea', placeholder: 'Kullanim oncesi kontrol listesi' },
      ],
    }
  }
  if (moduleType === 'ward_round') {
    return {
      intro: 'Servis vizit takip formu',
      fields: [
        { key: 'wardName', label: 'Servis / Oda', type: 'text', required: true, placeholder: 'Kardiyoloji - Oda 312' },
        { key: 'doctorName', label: 'Vizit Hekimi', type: 'text', required: true, placeholder: 'Dr. ...' },
        { key: 'roundAt', label: 'Vizit Saati', type: 'datetime-local', required: true },
        { key: 'roundNote', label: 'Vizit Notu', type: 'textarea', required: true, placeholder: 'Muayene bulgulari ve plan' },
      ],
    }
  }
  if (moduleType === 'discharge_process') {
    return {
      intro: 'Taburcu kontrol listesi',
      fields: [
        { key: 'dischargeAt', label: 'Taburcu Tarih/Saat', type: 'datetime-local', required: true },
        { key: 'prescriptionReady', label: 'Recete Hazir', type: 'select', options: ['Evet', 'Hayir'], required: true },
        { key: 'educationGiven', label: 'Egitim Verildi', type: 'select', options: ['Evet', 'Hayir'], required: true },
        { key: 'dischargeNote', label: 'Taburcu Notu', type: 'textarea', required: true, placeholder: 'Kontrol randevusu ve oneri' },
      ],
    }
  }
  if (moduleType === 'appointment_reminder') {
    return {
      intro: 'Randevu bilgilendirme formu',
      fields: [
        { key: 'appointmentAt', label: 'Randevu Tarih/Saat', type: 'datetime-local', required: true },
        { key: 'clinic', label: 'Klinik', type: 'text', required: true, placeholder: 'Dahiliye / Ortopedi...' },
        { key: 'doctor', label: 'Hekim', type: 'text', placeholder: 'Dr. ...' },
        { key: 'prepInfo', label: 'Hazirlik Bilgisi', type: 'textarea', placeholder: 'Acilik, aclik, evrak bilgisi' },
      ],
    }
  }
  if (moduleType === 'hygiene_audit') {
    return {
      intro: 'Sterilizasyon denetim formu',
      fields: [
        { key: 'auditArea', label: 'Denetim Alani', type: 'text', required: true, placeholder: 'Ameliyathane / Yogun Bakim' },
        { key: 'compliance', label: 'Uyum Durumu', type: 'select', options: ['Tam Uyumlu', 'Kismen Uyumlu', 'Uyumsuz'], required: true },
        { key: 'deviation', label: 'Sapma Tespiti', type: 'textarea', required: true, placeholder: 'Tespit edilen uygunsuzluklar' },
      ],
    }
  }
  if (moduleType === 'emergency_protocol') {
    return {
      intro: 'Acil mudahale protokol formu',
      fields: [
        { key: 'incidentType', label: 'Acil Durum Tipi', type: 'select', options: ['Mavi Kod', 'Kirmizi Kod', 'Beyaz Kod', 'Diger'], required: true },
        { key: 'responseTime', label: 'Mudahale Suresi (dk)', type: 'number', required: true, placeholder: '0' },
        { key: 'protocolNote', label: 'Mudahale Notu', type: 'textarea', required: true, placeholder: 'Uygulanan adimlar' },
      ],
    }
  }
  if (moduleType === 'staff_auth') {
    return {
      intro: 'Personel yetki dogrulama formu',
      fields: [
        { key: 'staffId', label: 'Personel ID', type: 'text', required: true, placeholder: 'STF-1042' },
        { key: 'role', label: 'Rol', type: 'select', options: ['Hemsire', 'Doktor', 'Teknisyen', 'Idari'], required: true },
        { key: 'accessScope', label: 'Yetki Kapsami', type: 'textarea', required: true, placeholder: 'Erisim verilecek moduller' },
      ],
    }
  }
  if (moduleType === 'quality_check' || moduleType === 'safety_audit' || moduleType === 'shelf_audit' || moduleType === 'store_checklist' || moduleType === 'vehicle_inspection') {
    return {
      intro: 'Denetim / kontrol checklist formu',
      fields: [
        { key: 'area', label: 'Alan / Istasyon', type: 'text', required: true, placeholder: 'Hat-3 / Raf-A12 / Arac-34' },
        { key: 'status', label: 'Durum', type: 'select', options: ['Uygun', 'Uygunsuz', 'Kritik'], required: true },
        { key: 'finding', label: 'Bulgular', type: 'textarea', required: true, placeholder: 'Tespit edilen durumlar' },
      ],
    }
  }
  if (moduleType === 'maintenance' || moduleType === 'maintenance_request') {
    return {
      intro: 'Bakim talep formu',
      fields: [
        { key: 'assetCode', label: 'Makine / Ekipman Kodu', type: 'text', required: true, placeholder: 'MC-204' },
        { key: 'priority', label: 'Oncelik', type: 'select', options: ['Dusuk', 'Normal', 'Yuksek', 'Acil'], required: true },
        { key: 'issue', label: 'Ariza / Talep Detayi', type: 'textarea', required: true, placeholder: 'Arizanin aciklamasi' },
      ],
    }
  }
  if (moduleType === 'line_shift') {
    return {
      intro: 'Vardiya hat devir teslim formu',
      fields: [
        { key: 'lineCode', label: 'Hat Kodu', type: 'text', required: true, placeholder: 'HAT-03' },
        { key: 'shift', label: 'Vardiya', type: 'select', options: ['Gunduz', 'Gece'], required: true },
        { key: 'handoffSummary', label: 'Devir Ozeti', type: 'textarea', required: true, placeholder: 'Makine durumu, bekleyen isler' },
      ],
    }
  }
  if (moduleType === 'machine_safety') {
    return {
      intro: 'Makine guvenlik kontrol formu',
      fields: [
        { key: 'machineCode', label: 'Makine Kodu', type: 'text', required: true, placeholder: 'MC-20' },
        { key: 'lockoutTagout', label: 'LOTO Durumu', type: 'select', options: ['Uygulandi', 'Uygulanmadi'], required: true },
        { key: 'riskNote', label: 'Risk Notu', type: 'textarea', required: true, placeholder: 'Tespit edilen riskler' },
      ],
    }
  }
  if (moduleType === 'defect_report') {
    return {
      intro: 'Defolu urun bildirim formu',
      fields: [
        { key: 'batchNo', label: 'Parti No', type: 'text', required: true, placeholder: 'LOT-2026-04' },
        { key: 'defectType', label: 'Hata Tipi', type: 'text', required: true, placeholder: 'Yuzey hatasi / Olcu disi' },
        { key: 'rootCauseHint', label: 'Muhtemel Kok Neden', type: 'textarea', placeholder: 'On analiz notu' },
      ],
    }
  }
  if (moduleType === 'operator_training') {
    return {
      intro: 'Operator egitim katilim formu',
      fields: [
        { key: 'operatorId', label: 'Operator ID', type: 'text', required: true, placeholder: 'OP-104' },
        { key: 'trainingTopic', label: 'Egitim Konusu', type: 'text', required: true, placeholder: 'Guvenlik / Kalite / Makine' },
        { key: 'result', label: 'Egitim Sonucu', type: 'select', options: ['Basarili', 'Tekrar Gerekli'], required: true },
      ],
    }
  }
  if (moduleType === 'tooling_change') {
    return {
      intro: 'Takim kalip degisim kayit formu',
      fields: [
        { key: 'toolCode', label: 'Takim/Kalip Kodu', type: 'text', required: true, placeholder: 'KLP-09' },
        { key: 'changedAt', label: 'Degisim Zamani', type: 'datetime-local', required: true },
        { key: 'changeReason', label: 'Degisim Nedeni', type: 'textarea', required: true, placeholder: 'Planli bakim / ariza' },
      ],
    }
  }
  if (moduleType === 'stock_count' || moduleType === 'warehouse_entry' || moduleType === 'raw_material_intake' || moduleType === 'loading_check') {
    return {
      intro: 'Stok / depo hareket formu',
      fields: [
        { key: 'itemCode', label: 'Urun Kodu', type: 'text', required: true, placeholder: 'SKU-9821' },
        { key: 'quantity', label: 'Miktar', type: 'number', required: true, placeholder: '0' },
        { key: 'unit', label: 'Birim', type: 'select', options: ['Adet', 'Koli', 'Palet', 'Kg'], required: true },
      ],
    }
  }
  if (moduleType === 'campaign_check') {
    return {
      intro: 'Kampanya uygunluk kontrol formu',
      fields: [
        { key: 'campaignCode', label: 'Kampanya Kodu', type: 'text', required: true, placeholder: 'CMP-2026-11' },
        { key: 'shelfStatus', label: 'Raf Uygunlugu', type: 'select', options: ['Uygun', 'Eksik', 'Yanlis Uygulama'], required: true },
        { key: 'evidence', label: 'Kanit / Not', type: 'textarea', placeholder: 'Eksik urun, yanlis etiket vb.' },
      ],
    }
  }
  if (moduleType === 'product_story') {
    return {
      intro: 'Urun hikayesi ve icerik geri bildirim formu',
      fields: [
        { key: 'productCode', label: 'Urun Kodu', type: 'text', required: true, placeholder: 'SKU-7721' },
        { key: 'contentClarity', label: 'Icerik Anlasilirligi', type: 'select', options: ['Cok Iyi', 'Iyi', 'Orta', 'Zayif'], required: true },
        { key: 'question', label: 'Musteri Sorusu', type: 'textarea', placeholder: 'Urunle ilgili sorunuz' },
      ],
    }
  }
  if (moduleType === 'price_check') {
    return {
      intro: 'Fiyat ve etiket dogrulama formu',
      fields: [
        { key: 'shelfTagPrice', label: 'Etiket Fiyati', type: 'text', required: true, placeholder: '149.90' },
        { key: 'cashierPrice', label: 'Kasa Fiyati', type: 'text', required: true, placeholder: '149.90' },
        { key: 'mismatchReason', label: 'Uyumsuzluk Nedeni', type: 'textarea', placeholder: 'Fiyat farki varsa aciklayin' },
      ],
    }
  }
  if (moduleType === 'staff_tasklist') {
    return {
      intro: 'Magaza personel gorev tamamlama formu',
      fields: [
        { key: 'staffId', label: 'Personel ID', type: 'text', required: true, placeholder: 'PRK-55' },
        { key: 'taskType', label: 'Gorev Tipi', type: 'select', options: ['Raf Duzeni', 'Etiket', 'Temizlik', 'Sayim'], required: true },
        { key: 'completionNote', label: 'Tamamlama Notu', type: 'textarea', required: true, placeholder: 'Yapilan isler' },
      ],
    }
  }
  if (moduleType === 'delivery_proof' || moduleType === 'driver_route_handoff') {
    return {
      intro: 'Teslimat kanit ve devir formu',
      fields: [
        { key: 'shipmentCode', label: 'Sevkiyat Kodu', type: 'text', required: true, placeholder: 'SHP-44021' },
        { key: 'deliveredAt', label: 'Teslim Zamani', type: 'datetime-local', required: true },
        { key: 'receiver', label: 'Teslim Alan', type: 'text', required: true, placeholder: 'Ad Soyad' },
        { key: 'notes', label: 'Not', type: 'textarea', placeholder: 'Teslimat notu' },
      ],
    }
  }
  if (moduleType === 'route_audit') {
    return {
      intro: 'Rota denetim ve gecikme rapor formu',
      fields: [
        { key: 'routeCode', label: 'Rota Kodu', type: 'text', required: true, placeholder: 'RTR-09' },
        { key: 'checkpointStatus', label: 'Checkpoint Durumu', type: 'select', options: ['Zamaninda', 'Gecikmeli', 'Atlandi'], required: true },
        { key: 'delayReason', label: 'Gecikme Nedeni', type: 'textarea', placeholder: 'Trafik, evrak, arac arizasi...' },
      ],
    }
  }
  if (moduleType === 'damage_report') {
    return {
      intro: 'Paket hasar bildirim formu',
      fields: [
        { key: 'shipmentCode', label: 'Sevkiyat Kodu', type: 'text', required: true, placeholder: 'SHP-9912' },
        { key: 'damageLevel', label: 'Hasar Seviyesi', type: 'select', options: ['Hafif', 'Orta', 'Agir'], required: true },
        { key: 'damageDetail', label: 'Hasar Detayi', type: 'textarea', required: true, placeholder: 'Hasarin yeri ve tipi' },
      ],
    }
  }
  if (moduleType === 'cold_chain_tracking') {
    return {
      intro: 'Soguk zincir olcum kayit formu',
      fields: [
        { key: 'containerCode', label: 'Konteyner Kodu', type: 'text', required: true, placeholder: 'CLD-17' },
        { key: 'temperature', label: 'Sicaklik (C)', type: 'number', required: true, placeholder: '4' },
        { key: 'thresholdStatus', label: 'Limit Durumu', type: 'select', options: ['Limit Icinde', 'Limit Disi'], required: true },
      ],
    }
  }
  if (moduleType === 'customs_docs') {
    return {
      intro: 'Gumruk ve evrak dogrulama formu',
      fields: [
        { key: 'documentType', label: 'Belge Tipi', type: 'select', options: ['Fatura', 'Konsemento', 'Mensei', 'Diger'], required: true },
        { key: 'documentNo', label: 'Belge No', type: 'text', required: true, placeholder: 'DOC-2026-0081' },
        { key: 'validationNote', label: 'Dogrulama Notu', type: 'textarea', required: true, placeholder: 'Belge kontrol sonucu' },
      ],
    }
  }
  if (moduleType === 'customer_survey') {
    return {
      intro: 'Musteri geri bildirim formu',
      fields: [
        { key: 'rating', label: 'Memnuniyet Puani', type: 'select', options: ['1', '2', '3', '4', '5'], required: true },
        { key: 'comment', label: 'Yorum', type: 'textarea', required: true, placeholder: 'Deneyiminizi yazin' },
      ],
    }
  }
  if (moduleType === 'conveyor_count') {
    return {
      intro: 'Bant qr sayim olay kaydi',
      fields: [
        { key: 'lineCode', label: 'Bant Kodu', type: 'text', required: true, placeholder: 'BANT-01' },
        { key: 'productQr', label: 'Urun QR', type: 'text', required: true, placeholder: 'QR-...' },
        { key: 'scannerId', label: 'Okuyucu Kodu', type: 'text', placeholder: 'CAM-01' },
      ],
    }
  }

  return {
    intro: 'Modul islem formu',
    fields: [
      { key: 'referenceCode', label: 'Referans Kodu', type: 'text', required: true, placeholder: 'REF-001' },
      { key: 'actionDetail', label: 'Islem Detayi', type: 'textarea', required: true, placeholder: 'Yapilan islem / talep detayi' },
    ],
  }
}

export default function SectorModulePublicClient(props: Props) {
  const { sector, tenantCode, tenantName, moduleSlug, moduleType, moduleTitle } = props
  const theme = SECTOR_THEME[sector]
  const formSpec = getFormSpec(moduleType)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Ad soyad gerekli')
      return
    }

    for (const field of formSpec.fields) {
      if (field.required && !String(formValues[field.key] || '').trim()) {
        setError(`${field.label} gerekli`)
        return
      }
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/sector/${sector}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantCode,
          moduleSlug,
          name: name.trim(),
          phone: phone.trim(),
          fields: formValues,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(String(data.error || 'Form gonderilemedi'))

      setSuccess('Formunuz basariyla alindi')
      setFormValues({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatasi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={`min-h-screen text-white px-4 py-10 ${theme.shell}`}>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className={`absolute -top-24 -right-20 h-72 w-72 rounded-full blur-3xl bg-gradient-to-br ${theme.patternA}`} />
        <div className={`absolute bottom-6 -left-20 h-80 w-80 rounded-full blur-3xl bg-gradient-to-br ${theme.patternB}`} />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto space-y-5">
        <section className={`rounded-3xl border p-6 ${theme.card}`}>
          <p className={`text-xs uppercase tracking-widest mb-2 ${theme.badge}`}>{SECTOR_LABEL[sector]} Module</p>
          <h1 className="text-2xl font-black tracking-tight">{moduleTitle || moduleType}</h1>
          <p className="text-sm text-neutral-400 mt-2">{tenantName} ({tenantCode})</p>
          <p className="text-sm text-neutral-500 mt-2">{formSpec.intro}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {theme.iconSet.map((icon, idx) => (
              <span key={`${icon}-${idx}`} className={`rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs ${theme.badge}`}>
                {icon}
              </span>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl border p-6 space-y-4 ${theme.card}`}>
          <h2 className="text-lg font-bold">Form</h2>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ad soyad"
            className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${theme.focus}`}
          />

          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Telefon (opsiyonel)"
            className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${theme.focus}`}
          />

          {formSpec.fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <p className="text-sm text-neutral-300">{field.label}{field.required ? ' *' : ''}</p>
              {field.type === 'textarea' ? (
                <textarea
                  value={formValues[field.key] || ''}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  rows={4}
                  placeholder={field.placeholder || ''}
                  className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${theme.focus}`}
                />
              ) : field.type === 'select' ? (
                <select
                  value={formValues[field.key] || ''}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${theme.focus}`}
                >
                  <option value="">Seciniz</option>
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formValues[field.key] || ''}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  placeholder={field.placeholder || ''}
                  className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${theme.focus}`}
                />
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className={`rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50 ${theme.button}`}
          >
            {loading ? 'Gonderiliyor...' : 'Formu Gonder'}
          </button>

          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </section>
      </div>
    </main>
  )
}
