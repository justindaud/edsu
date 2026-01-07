/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { fetchArtists } from '@/lib/services'
import type { Artist } from '@/lib/types'
import { ParallaxScroll } from '@/components/ui/paralax-scroll-2'

const placeholderImg = '/logo.gif'

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArtists()
      .then((ar) => setArtists(ar || []))
      .finally(() => setLoading(false))
  }, [])

  const parallaxItems = useMemo(() => {
    const imgs = artists.map((a) => {
      const photoSrc = (a.photo as any)?.thumbnailUrl || (a.photo as any)?.url
      const artwork = a.artworks?.find((m) => m.thumbnailUrl || m.url)
      const artworkSrc = artwork?.thumbnailUrl || artwork?.url
      const src = photoSrc || artworkSrc
      if (src) {
        return {
          src,
          href: `/artists/${a._id || (a as any).id || ''}`,
          back: (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--edsu-white)] p-4 text-center">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--edsu-pink)]">
                {a.name}
              </span>
              {a.description && (
                <p className="text-xs leading-relaxed text-[var(--edsu-black)] line-clamp-3">{a.description}</p>
              )}
              <Link
                href={`/artists/${a._id || (a as any).id || ''}`}
                className="text-xs uppercase tracking-[0.16em] text-[var(--edsu-black)] underline underline-offset-4"
              >
                View Artist
              </Link>
            </div>
          ),
        }
      }
      return {
        src: placeholderImg,
        href: `/artists/${a._id || (a as any).id || ''}`,
        render: (
          <div className="h-full w-full flex items-center justify-center bg-[var(--edsu-pink)] text-[var(--edsu-white)]">
            <span className="text-lg font-semibold text-center px-4">{a.name}</span>
          </div>
        ),
        back: (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--edsu-white)] p-4 text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--edsu-pink)]">
              {a.name}
            </span>
            <Link
              href={`/artists/${a._id || (a as any).id || ''}`}
              className="text-xs uppercase tracking-[0.16em] text-[var(--edsu-black)] underline underline-offset-4"
            >
              View Artist
            </Link>
          </div>
        ),
      }
    })
    for (let i = imgs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[imgs[i], imgs[j]] = [imgs[j], imgs[i]]
    }
    return imgs
  }, [artists])

  return (
    <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-[900] uppercase tracking-[0.16em]">Artist5</h1>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={`artist-skeleton-${idx}`} className="space-y-3">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <div className="h-3 w-2/3 bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : parallaxItems.length > 0 ? (
        <ParallaxScroll
          items={parallaxItems as any}
          variant="flip"
          className="mb-8 sm:mb-10"
        />
      ) : null}
      
    </main>
  )
}
