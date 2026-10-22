'use client'

export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full border border-[#dde3ea] bg-white px-4 py-2 font-medium text-[#0f1b2d]">
      🖨️ {label}
    </button>
  )
}
