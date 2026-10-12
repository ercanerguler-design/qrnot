import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WarmPage } from '@/components/warm/SiteChrome'
import { getLegalDoc, LEGAL_DOCS } from '@/lib/legal'

type Props = { params: Promise<{ doc: string }> }

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ doc: doc.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getLegalDoc((await params).doc)
  if (!doc) return {}
  return { title: doc.title, alternates: { canonical: `/legal/${doc.slug}` } }
}

export default async function LegalPage({ params }: Props) {
  const doc = getLegalDoc((await params).doc)
  if (!doc) notFound()
  const others = LEGAL_DOCS.filter((item) => item.lang === doc.lang && item.slug !== doc.slug)

  return (
    <WarmPage lang={doc.lang}>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-[1fr_220px]">
        <article className="w-card w-prose p-6 sm:p-10">
          <h1 className="font-display text-3xl font-semibold text-ink">{doc.title}</h1>
          <p className="!text-xs text-muted">
            {doc.lang === 'en' ? 'Last updated' : 'Son güncelleme'}: {doc.updated}
          </p>
          {doc.blocks.map(([type, text], index) => {
            if (type === 'h2') return <h2 key={index}>{text}</h2>
            if (type === 'h3') return <h3 key={index}>{text}</h3>
            if (type === 'ul')
              return (
                <ul key={index}>
                  {text.split('|').map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )
            return <p key={index}>{text}</p>
          })}
        </article>
        <nav className="space-y-2 text-sm" aria-label="Legal">
          {others.map((item) => (
            <Link key={item.slug} href={`/legal/${item.slug}`} className="block text-ink-2 hover:text-ink">
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </WarmPage>
  )
}
