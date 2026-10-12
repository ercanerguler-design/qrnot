import { notFound } from 'next/navigation'
import SectorModulePublicClient from '@/components/SectorModulePublicClient'
import { getPublicSectorModule } from '@/lib/sectorPublic'

interface Props {
  params: Promise<{ tenantCode: string; slug: string }>
}

export default async function RetailModulePage({ params }: Props) {
  const { tenantCode, slug } = await params
  const moduleInfo = await getPublicSectorModule('retail', tenantCode, slug)
  if (!moduleInfo) notFound()

  return (
    <SectorModulePublicClient
      sector="retail"
      tenantCode={moduleInfo.tenantCode}
      tenantName={moduleInfo.tenantName}
      moduleSlug={moduleInfo.moduleSlug}
      moduleType={moduleInfo.moduleType}
      moduleTitle={moduleInfo.moduleTitle}
    />
  )
}
