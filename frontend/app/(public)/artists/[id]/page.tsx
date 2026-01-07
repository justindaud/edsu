/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchArtist, fetchArtworks, fetchArtists } from '@/lib/services'
import { getMediaType } from '@/lib/utils'
import type { Artist, Media } from '@/lib/types'
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll'
import { BlurFade } from '@/components/ui/blur-fade'
import { Marquee, MarqueeContent, MarqueeItem } from '@/components/ui/shadcn-io/marquee'
import { PixelImage } from '@/components/ui/pixel-image'
import Image from 'next/image'

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase() || 'A'
}

export default function ArtistDetail() {
  const params = useParams<{ id: string }>()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [artworks, setArtworks] = useState<Media[]>([])
  const [allArtists, setAllArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return
      try {
        const [a, aw, ar] = await Promise.all([
          fetchArtist(params.id as string).catch(() => null),
          fetchArtworks().catch(() => []),
          fetchArtists().catch(() => []),
        ])
        setArtist(a)
        setAllArtists(ar || [])
        if (a?._id) {
          const rel = (aw || []).filter((m) => (m.artistId || (m as any).artist?._id) === a._id)
          setArtworks(rel)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.id])

  const heroImg = useMemo(() => {
    if (!artist) return ""
    const photo = (artist.photo as any)?.thumbnailUrl || (artist.photo as any)?.url
    if (photo) return photo
    const firstArtwork = artworks[0]
    return firstArtwork?.thumbnailUrl || firstArtwork?.url
  }, [artist, artworks])

  const otherArtists = useMemo(() => {
    const list = allArtists.filter((a) => a._id !== artist?._id)
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list.slice(0, 20)
  }, [allArtists, artist])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
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
  if (!artist) return <div></div>

  return (
    <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto flex-cols">
      <div className="relative h-[60vh] overflow-hidden">
        <PixelImage
          src={heroImg}
          grayscaleAnimation
        />
      </div>
      <h2 className="text-lg font-[900] uppercase tracking-[0.16em]">{artist.name}</h2>
      {artist.description && <p className="text-sm leading-relaxed text-[var(--foreground)]">{artist.description}</p>}

      {artworks.length > 0 && (
        <RevealOnScroll effect="blurIn" className="space-y-3">
          <div className="grid gap-4 sm:gap-5 md:grid-cols-5 py-4">
            {artworks.map((aw, idx) => (
              <BlurFade key={aw.id || aw._id} delay={idx * 0.04}>
                <Link
                  href={`/artworks/${aw.id || aw._id}`}
                  className="block overflow-hidden bg-[var(--card)] hover:-translate-y-1 transition-transform"
                >
                  <div className="relative h-[30vh] w-full">
                    {aw.isVideo || getMediaType(aw.thumbnailUrl || aw.url) === 'video' ? (
                      <video
                        src={aw.url}
                        className="h-full w-full object-contain"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                    ) : (
                      <Image className="absolute inset-0 h-full w-full object-contain"
                        src={aw.url || ''}
                        alt={aw.title || ''}
                        width={720}
                        height={720}
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-semibold line-clamp-2">{aw.title || ''}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{aw.year || ''}</p>
                  </div>
                </Link>
              </BlurFade>
            ))}
          </div>
        </RevealOnScroll>
      )}

      {otherArtists.length > 0 && (
        <RevealOnScroll effect="fadeIn" className="space-y-3 mt-10">
          <div className="relative w-full">
            <Marquee className="py-2">
              <MarqueeContent speed={50} gradient={false}>
                {otherArtists.map((a) => (
                  <MarqueeItem key={a._id || (a as any).id} className="mx-3">
                    {(() => {
                      const avatarSrc =
                        (a.photo as any)?.thumbnailUrl ||
                        (a.photo as any)?.url ||
                        artworks.find((m) => m.artistId === a._id)?.thumbnailUrl ||
                        artworks.find((m) => m.artistId === a._id)?.url ||
                        ''
                      const avatarType = getMediaType(avatarSrc, (a.photo as any)?.type)
                      const initials = getInitials(a.name || '')
                      return (
                    <Link
                      href={`/artists/${a._id || (a as any).id || ''}`}
                      className="flex items-center gap-2 bg-[var(--card)] px-3 py-2"
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[var(--edsu-green)]">
                        {avatarSrc && avatarType !== 'video' ? (
                          <Image className="absolute inset-0 h-full w-full object-cover"
                            src={avatarSrc}
                            alt={a.name}
                            width={720}
                            height={720}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--edsu-pink)]">
                            {initials}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-semibold">{a.name}</span>
                    </Link>
                      )
                    })()}
                  </MarqueeItem>
                ))}
              </MarqueeContent>
            </Marquee>
          </div>
        </RevealOnScroll>
      )}
    </main>
  )
}
