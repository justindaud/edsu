/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { fetchArtworks, fetchArtists } from '@/lib/services'
import type { Media, Artist } from '@/lib/types'
import { ParallaxScroll } from '@/components/ui/paralax-scroll-2'
import { BlurFade } from '@/components/ui/blur-fade'
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll'

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Media[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchArtworks().catch(() => []), fetchArtists().catch(() => [])])
      .then(([aw, ar]) => {
        setArtworks(aw || [])
        setArtists(ar || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const parallaxItems = useMemo(() => {
    const imgs = artworks
      .filter((a) => a.thumbnailUrl || a.url)
      .map((a) => ({
        src: a.thumbnailUrl || a.url || '',
        href: `/artworks/${a.id || a._id}`,
      }))
    for (let i = imgs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[imgs[i], imgs[j]] = [imgs[j], imgs[i]]
    }
    return imgs
  }, [artworks])

  const artistName = (id?: string) => artists.find((a) => a._id === id)?.name

  return (
    <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-[900] uppercase tracking-[0.16em]">Artwork5</h1>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={`artwork-skeleton-${idx}`} className="space-y-3">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <div className="h-3 w-2/3 bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <ParallaxScroll items={parallaxItems} className="mb-8 sm:mb-10" />
      )}

    </main>
  )
}
