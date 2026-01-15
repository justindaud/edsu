'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Timeline } from '@/components/ui/timeline'
import { fetchPrograms, fetchArtists } from '@/lib/services'
import type { Program, Artist } from '@/lib/types'
import { ImagesSlider } from '@/components/ui/images-slider'
import { AvatarGroup } from '@/components/ui/shadcn-io/avatar-group'
import { AnimatedTooltip } from '@/components/ui/shadcn-io/animated-tooltip'
import { BlurFade } from '@/components/ui/blur-fade'

type TinyArtist = { id: string; name: string; photo?: string }

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase() || ''
}

const formatDate = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const shuffleArray = <T,>(items: T[]) => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [allArtists, setAllArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchPrograms(), fetchArtists()])
      .then(([progs, artists]) => {
        setPrograms(progs || [])
        setAllArtists(artists || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const items = useMemo(() => {
    const artistIndex = new Map<string, Artist>()
    allArtists.forEach((a) => {
      const id = a._id || (a as any).id
      if (id) artistIndex.set(id, a)
    })

    const sorted = [...programs].sort((a, b) => {
      const aDate = new Date(a.startDate || a.createdAt || '').getTime()
      const bDate = new Date(b.startDate || b.createdAt || '').getTime()
      return bDate - aDate
    })

    return sorted.map((program) => {
      const mediaList = [...(program.media || []), ...(program.artworks || [])]
      const sliderImages = mediaList.map((m) => m.thumbnailUrl || m.url).filter(Boolean) as string[]
      const range = [formatDate(program.startDate), formatDate(program.endDate)].filter(Boolean).join(' — ')

      // collect artists only from artworks (program.media are program photos, not artworks)
      const artistMap = new Map<string, TinyArtist>()
      ;(program.artworks || []).forEach((aw) => {
        // Prefer explicit artist object
        const a = aw.artist as any
        let id = a?._id || a?.id || null
        let name =
          a?.name ||
          a?.username ||
          a?.fullName ||
          (aw as any).artistName ||
          (aw as any).artist_name ||
          null

        // Fallback: if only artist_id present on media
        if (!id) {
          id = (aw as any).artist_id || aw.artistId || null
        }
        if (!name && id) {
          const resolved = artistIndex.get(String(id))
          name = resolved?.name || ''
        }
        if (id && name) {
          const resolved = artistIndex.get(String(id))
          const resolvedPhoto =
            resolved?.photo?.url ||
            resolved?.photo?.thumbnailUrl ||
            (resolved as any)?.photo ||
            (resolved as any)?.photoUrl
          if (!artistMap.has(String(id))) {
            artistMap.set(String(id), {
              id: String(id),
              name: typeof name === 'string' ? name : '',
              photo: resolvedPhoto || a?.photo?.url || a?.photo?.thumbnailUrl || null,
            })
          }
        }
      })
      const artists = Array.from(artistMap.values())
      const shownArtists =
        artists.length > 5 ? shuffleArray(artists).slice(0, 5).sort((a, b) => Number(!b.photo) - Number(!a.photo)) : artists

      return {
        title: `${program.title}`,
        content: (
          <div className="bg-[var(--card)] text-[var(--edsu-pink)] space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <BlurFade>
              <Link
                href={`/programs/${program._id || program.id || ''}`}
                className="relative block w-full h-[50vh] "
              >
                <ImagesSlider
                  images={sliderImages}
                  overlay={false}
                  autoplay={true}
                >
                  <div />
                </ImagesSlider>
              </Link>
              <div className="flex-1 space-y-3">
                <Link href={`/programs/${program._id || program.id || ''}`} className="space-y-2 block">
                  <h1 className="leading-tight pt-8">
                    {range}
                  </h1>
                  {program.description && (
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)] line-clamp-4">
                      {program.description}
                    </p>
                  )}
                </Link>
                {shownArtists.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 max-w-[60vw]">
                    <AvatarGroup className="flex-row-reverse -space-x-0.5 sm:-space-x-0.5" variant="css">
                      {shownArtists.map((a, idx) => (
                        <AnimatedTooltip
                          key={a.id}
                          items={[
                            {
                              id: idx,
                              name: a.name,
                              designation: '',
                              image: a.photo,
                              fallback: getInitials(a.name),
                              href: `/artists/${a.id}`,
                            },
                          ]}
                        />
                      ))}
                    </AvatarGroup>
                    {artists.length > shownArtists.length && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        … and {artists.length - shownArtists.length} more
                      </span>
                    )}
                  </div>
                )}
                <Link
                  href={`/programs/${program._id || program.id || ''}`}
                  className="inline-flex text-sm font-semibold text-[var(--primary)] underline underline-offset-4"
                >
                  View program details
                </Link>
              </div>
              </BlurFade>
            </div>
          </div>
        ),
      }
    })
  }, [programs, allArtists])

  return (
    <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <header className="mb-8 space-y-2">
        <h1 className="text-4xl sm:text-4xl font-[900] uppercase tracking-[0.16em]">
          Program5
        </h1>
      </header>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`program-skeleton-${idx}`} className="space-y-3">
              <div className="h-6 w-40 bg-muted animate-pulse" />
              <div className="h-[40vh] w-full bg-muted animate-pulse" />
              <div className="h-4 w-2/3 bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative w-full overflow-clip">
          <Timeline data={items} />
        </div>
      )}

    </main>
  )
}
