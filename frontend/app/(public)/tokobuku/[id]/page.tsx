/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchBeEm, fetchBeEmById } from '@/lib/services'
import type { BeEm } from '@/lib/types'
import { getMediaType } from '@/lib/utils'
import { ParallaxScroll } from '@/components/ui/paralax-scroll-2'
import { PixelImage } from '@/components/ui/pixel-image'

export default function TokobukuDetailPage() {
  const params = useParams<{ id: string }>()
  const [book, setBook] = useState<BeEm | null>(null)
  const [others, setOthers] = useState<BeEm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return
      try {
        const [detail, all] = await Promise.all([
          fetchBeEmById(params.id).catch(() => null),
          fetchBeEm().catch(() => []),
        ])
        setBook(detail || null)
        setOthers((all || []).filter((b) => (b.id || b._id) !== params.id))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.id])

  const cover = book?.thumbnailUrl || book?.url || ''
  const coverType = getMediaType(cover)

  const related = useMemo(() => {
    const list = [...others]
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list.slice(0, 30)
  }, [others])

  const relatedItems = useMemo(() => {
    return related
      .map((b) => {
        const src = b.thumbnailUrl || b.url || ''
        if (!src) return null
        return {
          src,
          back: (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--edsu-pink)]">
                {b.title || 'Untitled'}
              </span>
              {b.description && (
                <span className="text-xs leading-relaxed text-[var(--edsu-black)] line-clamp-3">
                  {b.description}
                </span>
              )}
              <Link
                href={`/tokobuku/${b.id || b._id || ''}`}
                className="text-xs uppercase tracking-[0.16em] text-[var(--edsu-black)] underline underline-offset-4"
              >
                View Detail
              </Link>
            </div>
          ),
        }
      })
      .filter(Boolean)
  }, [related])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--edsu-cream)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
        <div className="space-y-6">
          <div className="h-8 w-3/4 bg-muted animate-pulse" />
          <div className="h-64 w-full bg-muted animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted animate-pulse" />
            <div className="h-4 w-5/6 bg-muted animate-pulse" />
            <div className="h-4 w-2/3 bg-muted animate-pulse" />
          </div>
        </div>
      </main>
    )
  }
  if (!book) return <div />

  return (
    <main className="min-h-screen bg-[var(--edsu-cream)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-[900] uppercase tracking-[0.16em]">
          {book.title || ''}
        </h1>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-[var(--edsu-black)]">
          {book.author && <span>{book.author}</span>}
          {book.year && <span>{book.year}</span>}
        </div>
      </header>

      <div className="relative mx-auto mb-8 h-[60vh] w-full overflow-hidden">
        {cover && coverType === 'video' ? (
          <video
            src={cover}
            className="h-full w-full object-contain"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : cover ? (
          <PixelImage
            src={cover}
            grayscaleAnimation
          />
        ) : null}
      </div>

      {book.description && (
        <article className="mx-auto w-full max-w-5xl space-y-4 text-[var(--edsu-black)]">
          <p className="text-sm leading-relaxed">{book.description}</p>
        </article>
      )}

      {relatedItems.length > 0 && (
        <section className="mt-12">
          <ParallaxScroll
            items={relatedItems as any}
            variant="flip"
            className="mb-8 sm:mb-10"
          />
        </section>
      )}
    </main>
  )
}
