import { notFound } from 'next/navigation'
import SectorModulePublicClient from '@/components/SectorModulePublicClient'
import { getPublicSectorModule } from '@/lib/sectorPublic'

interface Props {
  params: Promise<{ tenantCode: string; slug: string }>
}

export default async function FactoryModulePage({ params }: Props) {
  const { tenantCode, slug } = await params
  const moduleInfo = await getPublicSectorModule('factory', tenantCode, slug)
  if (!moduleInfo) notFound()

  return (
    <SectorModulePublicClient
      sector="factory"
      tenantCode={moduleInfo.tenantCode}
      tenantName={moduleInfo.tenantName}
      moduleSlug={moduleInfo.moduleSlug}
      moduleType={moduleInfo.moduleType}
      moduleTitle={moduleInfo.moduleTitle}
    />
  )
}
