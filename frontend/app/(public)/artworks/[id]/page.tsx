/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchArtwork, fetchArtworks, fetchArtists, fetchPrograms } from '@/lib/services'
import { getMediaType, imgproxy } from '@/lib/utils'
import type { Media, Artist, Program } from '@/lib/types'
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll'
import { ProfilePeek } from '@/components/ui/profile-peek'
import { ParallaxScroll } from '@/components/ui/paralax-scroll-2'
import { Lens } from '@/components/ui/lens'
import { PixelImage } from '@/components/ui/pixel-image'

export default function ArtworkDetail() {
  const params = useParams<{ id: string }>()
  const [artwork, setArtwork] = useState<Media | null>(null)
  const [allArtworks, setAllArtworks] = useState<Media[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return
      try {
        const [aw, all, ars, progs] = await Promise.all([
          fetchArtwork(params.id as string).catch(() => null),
          fetchArtworks().catch(() => []),
          fetchArtists().catch(() => []),
          fetchPrograms().catch(() => []),
        ])
        setArtwork(aw)
        setArtists(ars || [])
        setAllArtworks(all || [])
        setPrograms(progs || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.id])

  const artist = useMemo(
    () => artists.find((a) => a._id === (artwork?.artistId || (artwork as any)?.artist?._id)),
    [artists, artwork]
  )

  const displayedProgram = useMemo(() => {
    if (!artwork) return null
    const artworkId = artwork.id || artwork._id
    return programs.find((p) =>
      (p.artworks || []).some((aw) => (aw.id || aw._id) === artworkId)
    )
  }, [artwork, programs])

  const parallaxItems = useMemo(() => {
    if (!artwork) return []
    const currentId = artwork.id || artwork._id
    const currentArtistId = artwork.artistId || (artwork as any)?.artist?._id

    const artworkProgramIds = new Map<string, Set<string>>()
    programs.forEach((p) => {
      const pid = p.id || p._id
      ;(p.artworks || []).forEach((aw) => {
        const awId = aw.id || aw._id
        if (!awId) return
        const set = artworkProgramIds.get(awId) || new Set<string>()
        set.add(pid)
        artworkProgramIds.set(awId, set)
      })
    })

    const currentProgramIds = artworkProgramIds.get(currentId) || new Set<string>()

    const sameArtist: Media[] = []
    const sameProgram: Media[] = []
    const rest: Media[] = []

    allArtworks.forEach((m) => {
      const mId = m.id || m._id
      if (!mId || mId === currentId) return
      const mArtistId = m.artistId || (m as any)?.artist?._id
      const isSameArtist = currentArtistId && mArtistId === currentArtistId
      const mProgramIds = artworkProgramIds.get(mId)
      const isSameProgram =
        currentProgramIds.size > 0 &&
        mProgramIds &&
        Array.from(mProgramIds).some((pid) => currentProgramIds.has(pid))

      if (isSameArtist) sameArtist.push(m)
      else if (isSameProgram) sameProgram.push(m)
      else rest.push(m)
    })

    const shuffle = (items: Media[]) => {
      const arr = [...items]
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    }

    return [...shuffle(sameArtist), ...shuffle(sameProgram), ...shuffle(rest)]
      .slice(0, 45)
      .map((m) => ({
        src: m.thumbnailUrl || m.url || '/logo.gif',
        href: `/artworks/${m.id || m._id}`,
      }))
  }, [allArtworks, artwork, programs])

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
  if (!artwork) return <div></div>

  

  return (
    <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <div className="space-y-4">
          <div className="relative w-full h-[60vh] overflow-hidden">
            <PixelImage
              src={artwork.url || ''}
              grayscaleAnimation
            />
          </div>
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-4xl font-[900] uppercase tracking-[0.16em]">{artwork.title || ''}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {artist && (
              <ProfilePeek
                className="inline-block"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 underline font-semibold"
                    aria-label={`Peek ${artist.name}`}
                  >
                    <span className="relative h-10 w-10 overflow-hidden rounded-full bg-black">
                      
                      {getMediaType(
                        (artist.photo as any)?.thumbnailUrl ||
                          (artist.photo as any)?.url ||
                          artwork?.thumbnailUrl ||
                          artwork?.url,
                        (artist.photo as any)?.type
                      ) === 'video' ? (
                        <video
                          src={artwork?.url}
                          className="h-full w-full object-cover"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      ) : (
                        <img
                          src={imgproxy(((artist.photo as any)?.thumbnailUrl || (artist.photo as any)?.url || artwork?.thumbnailUrl || artwork?.url || ''), { w: 200 })}
                          alt={artist.name}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </span>
                    {artist.name}
                  </button>
                }
                content={
                  <Link
                  href={`/artists/${artist._id || (artist as any).id || ''}`}
                            className="text-[11px] font-semibold underline underline-offset-4"
                  >
                  <div className="w-[30vw] bg-[var(--card)] pt-15 px-3 text-[var(--card-foreground)] shadow-lg space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground line-clamp-4">{artist.description}</p>
                      <p className="text-xs text-[var(--edsu-pink)]">more from {artist.name}</p>
                    </div>
                  </div>
                  </Link>
                }
              />
              
            )}
            {artwork.year && <span>· {artwork.year}</span>}
          </div>
          {artwork.description && (
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              {artwork.description}
            </p>
          )}
          {displayedProgram && (
            <Link
                href={`/programs/${displayedProgram.id || displayedProgram._id}`}
            >
              <p className="text-xs tracking-[0.16em] text-[var(--edsu-black)]">
                Displayed on{' '}
                <span className="underline underline-offset-4 text-[var(--edsu-pink)] font-bold">
                  {displayedProgram.title}
                </span>
              </p>
            </Link>
          )}
        </div>
      </div>

      <RevealOnScroll effect="fadeIn" className="space-y-3 smt-10">
        <ParallaxScroll
          className="py-5"
          items={parallaxItems}
        />
      </RevealOnScroll>
    </main>
  )
}
