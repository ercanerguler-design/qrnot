import SectorAdminConsole from '@/components/SectorAdminConsole'

export default function HealthPage() {
  return (
    <SectorAdminConsole
      sector="health"
      title="Sağlık"
      subtitle="Klinik/hastane operasyonlarını bağımsız yönetim alanında yürüt."
      moduleOptions={[
        { value: 'patient_intake', label: 'Hasta Kayıt & Kabul', defaultTitle: 'Hasta Kabul Formu' },
        { value: 'triage_flow', label: 'Triage & Önceliklendirme', defaultTitle: 'Triage Değerlendirme Formu' },
        { value: 'lab_result', label: 'Laboratuvar Sonuç Modülü', defaultTitle: 'Lab Sonuç Sayfası' },
        { value: 'imaging_link', label: 'Görüntüleme Sonuç QR', defaultTitle: 'Radyoloji Sonuç Bağlantısı' },
        { value: 'medication_instruction', label: 'İlaç & Tedavi Talimatı QR', defaultTitle: 'Hasta İlaç Kullanım Rehberi' },
        { value: 'device_instruction', label: 'Tıbbi Cihaz Kullanım QR', defaultTitle: 'Cihaz Kullanım Kılavuzu' },
        { value: 'ward_round', label: 'Servis Vizit Takibi', defaultTitle: 'Vizit Takip Formu' },
        { value: 'discharge_process', label: 'Hasta Taburcu Süreci', defaultTitle: 'Taburcu Kontrol Listesi' },
        { value: 'appointment_reminder', label: 'Randevu Hatırlatma QR', defaultTitle: 'Randevu Bilgi Sayfası' },
        { value: 'hygiene_audit', label: 'Hijyen & Sterilizasyon Kontrol', defaultTitle: 'Sterilizasyon Denetim Formu' },
        { value: 'emergency_protocol', label: 'Acil Durum Prosedür QR', defaultTitle: 'Acil Müdahale Talimatları' },
        { value: 'staff_auth', label: 'Personel Kimlik Doğrulama', defaultTitle: 'Personel Yetki Sayfası' },
      ]}
    />
  )
}

