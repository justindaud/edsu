/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { fetchBeEm } from '@/lib/services'
import type { BeEm } from '@/lib/types'
import { ParallaxScroll } from '@/components/ui/paralax-scroll-2'

const shuffleArray = <T,>(items: T[]) => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function BeEmPage() {
  const [items, setItems] = useState<BeEm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBeEm()
      .then((res) => setItems(res || []))
      .finally(() => setLoading(false))
  }, [])

  const parallaxItems = useMemo(() => {
    return shuffleArray(items)
      .map((b) => {
        const src = b.thumbnailUrl || b.url || ''
        if (!src) return null
        return {
          src,
          back: (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--edsu-pink)]">
                {b.title || ''}
              </span>
              {b.description && (
                <span className="text-xs leading-relaxed text-[var(--edsu-black)] line-clamp-3">
                  {b.description}
                </span>
              )}
              <Link
                href={`/tokobuku/${b.id || b._id || ''}`}
                className="text-xs  tracking-[0.16em] text-[var(--edsu-black)] underline underline-offset-4"
              >
                View Detail
              </Link>
            </div>
          ),
        }
      })
      .filter(Boolean)
  }, [items])

  return (
    <main className="min-h-screen bg-[var(--edsu-cream)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-[900] uppercase tracking-[0.16em]">ToKo8uKu Y6n9T6u</h1>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={`book-skeleton-${idx}`} className="space-y-3">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <div className="h-3 w-2/3 bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <ParallaxScroll
          items={parallaxItems as any}
          variant="flip"
          className="mb-8 sm:mb-10"
        />
      )}
    </main>
  )
}
