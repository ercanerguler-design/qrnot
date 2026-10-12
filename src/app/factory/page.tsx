import SectorAdminConsole from '@/components/SectorAdminConsole'

export default function FactoryPage() {
  return (
    <SectorAdminConsole
      sector="factory"
      title="Fabrika"
      subtitle="Üretim hatları ve operatör süreçlerini ayrı fabrika veri alanında yönet."
      moduleOptions={[
        { value: 'quality_check', label: 'Kalite Kontrol', defaultTitle: 'Kalite Kontrol Kontrol Listesi' },
        { value: 'maintenance', label: 'Bakım Talep & Planlama', defaultTitle: 'Bakım Talep Formu' },
        { value: 'line_shift', label: 'Vardiya Hat Devir', defaultTitle: 'Vardiya Devir Formu' },
        { value: 'machine_safety', label: 'Makine Güvenlik Prosedür QR', defaultTitle: 'Makine Güvenlik Talimatları' },
        { value: 'safety_audit', label: 'İş Güvenliği Denetim Formu', defaultTitle: 'İSG Saha Denetim Formu' },
        { value: 'raw_material_intake', label: 'Hammadde Giriş Kaydı', defaultTitle: 'Hammadde Kabul Kontrol Formu' },
        { value: 'defect_report', label: 'Ürün Hatalı Rapor Formu', defaultTitle: 'Defolu Ürün Bildirim Formu' },
        { value: 'operator_training', label: 'Operatör Eğitim QR', defaultTitle: 'Operatör Eğitim İçeriği' },
        { value: 'tooling_change', label: 'Takım/Kalıp Değişim Kaydı', defaultTitle: 'Kalıp Değişim Formu' },
        { value: 'conveyor_count', label: 'Yürüyen Bant QR Sayımı', defaultTitle: 'Bant QR Sayım Modülü' },
      ]}
    />
  )
}

