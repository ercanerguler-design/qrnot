import SectorAdminConsole from '@/components/SectorAdminConsole'

export default function LogisticsPage() {
  return (
    <SectorAdminConsole
      sector="logistics"
      title="Lojistik"
      subtitle="Depo, sevkiyat ve dağıtım süreçlerini lojistik özel veri alanında yönet."
      moduleOptions={[
        { value: 'loading_check', label: 'Yükleme Kontrol Formu', defaultTitle: 'Yükleme Kontrol Formu' },
        { value: 'delivery_proof', label: 'Teslimat Kanıt & Doğrulama', defaultTitle: 'Teslimat Doğrulama Formu' },
        { value: 'route_audit', label: 'Rota Denetim Formu', defaultTitle: 'Rota Takip Formu' },
        { value: 'warehouse_entry', label: 'Depo Giriş/Çıkış Kaydı', defaultTitle: 'Depo Hareket Formu' },
        { value: 'vehicle_inspection', label: 'Araç Kontrol & Muayene', defaultTitle: 'Araç Muayene Formu' },
        { value: 'damage_report', label: 'Paket Hasar Tespit Formu', defaultTitle: 'Hasar Bildirim Formu' },
        { value: 'cold_chain_tracking', label: 'Soğuk Zincir Takip QR', defaultTitle: 'Soğuk Zincir Kontrol Formu' },
        { value: 'customs_docs', label: 'Gümrük & Belge Doğrulama', defaultTitle: 'Belge Doğrulama Sayfası' },
        { value: 'driver_route_handoff', label: 'Sürücü Güzergah Teslimi', defaultTitle: 'Güzergah Devir Formu' },
        { value: 'conveyor_count', label: 'Yürüyen Bant QR Sayımı', defaultTitle: 'Bant QR Sayım Modülü' },
      ]}
    />
  )
}

