import SectorAdminConsole from '@/components/SectorAdminConsole'

export default function RetailPage() {
  return (
    <SectorAdminConsole
      sector="retail"
      title="Perakende"
      subtitle="Mağaza operasyonu, stok ve saha ekiplerini perakende özel veri alanında yönet."
      moduleOptions={[
        { value: 'shelf_audit', label: 'Raf Denetim & Düzen', defaultTitle: 'Raf Düzen Denetim Formu' },
        { value: 'stock_count', label: 'Stok Sayım Modülü', defaultTitle: 'Stok Sayım Formu' },
        { value: 'campaign_check', label: 'Kampanya Uygunluk Kontrol', defaultTitle: 'Kampanya Kontrol Formu' },
        { value: 'product_story', label: 'Ürün Hikayesi & Bilgi QR', defaultTitle: 'Ürün Detay Sayfası' },
        { value: 'price_check', label: 'Fiyat & Etiket Doğrulama', defaultTitle: 'Fiyat Doğrulama Formu' },
        { value: 'customer_survey', label: 'Müşteri Memnuniyet Anketi', defaultTitle: 'Müşteri Geri Bildirim Formu' },
        { value: 'store_checklist', label: 'Mağaza Açılış/Kapanış Kontrol', defaultTitle: 'Mağaza Açılış Kontrol Listesi' },
        { value: 'staff_tasklist', label: 'Personel Görev Listesi QR', defaultTitle: 'Personel Günlük Görev Formu' },
        { value: 'maintenance_request', label: 'Tadilat & Bakım Talep', defaultTitle: 'Mağaza Bakım Talep Formu' },
        { value: 'conveyor_count', label: 'Yürüyen Bant QR Sayımı', defaultTitle: 'Bant QR Sayım Modülü' },
      ]}
    />
  )
}

