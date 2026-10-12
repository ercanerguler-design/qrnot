import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="warm flex min-h-screen items-center justify-center px-4">
      <div className="w-card max-w-md p-10 text-center">
        <p className="font-display text-6xl font-semibold text-coral">404</p>
        <h1 className="font-display mt-4 text-2xl font-semibold">Bu sayfa bulunamadı</h1>
        <p className="mt-1 text-sm text-muted">This page could not be found.</p>
        <div className="mt-6 grid gap-2">
          <Link href="/" className="w-btn w-btn-primary">
            Ana sayfa · Home
          </Link>
          <Link href="/shop" className="w-btn w-btn-ghost">
            Ürünler · Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
