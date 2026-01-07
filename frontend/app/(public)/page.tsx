/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useEffect, useMemo, useState } from 'react'
import { fetchPrograms, fetchMedia, fetchArtists, fetchArticles, fetchBeEm, fetchArtworks } from '@/lib/services'
import type { Program, Media, Artist, Article, BeEm } from '@/lib/types'
import { HeroParallax } from '@/components/ui/hero-parallax'
import { getMediaType } from '@/lib/utils'

type SectionMedia = Media | null

const formatDate = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PublicLanding() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [beem, setBeem] = useState<BeEm[]>([])
  const [artworks, setArtworks] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [stickyIndex, setStickyIndex] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [p, m, a, ar, b, aw] = await Promise.all([
          fetchPrograms().catch(() => []),
          fetchMedia().catch(() => []),
          fetchArtists().catch(() => []),
          fetchArticles().catch(() => []),
          fetchBeEm().catch(() => []),
          fetchArtworks().catch(() => []),
        ])
        setPrograms(p || [])
        setMedia(m || [])
        setArtists(a || [])
        setArticles(ar || [])
        setBeem(b || [])
        setArtworks(aw || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const heroMedia: SectionMedia = useMemo(() => {
    const chosen = media.find((m) => m.isHero)
    if (chosen) return chosen
    const vid = media.find((m) => (m.type || '').startsWith('video'))
    if (vid) return vid
    return media[0] || null
  }, [media])

  const currentProgram: Program | null = useMemo(() => {
    const today = new Date()
    const ongoing = programs
      .filter((p) => {
        if (!p.startDate || !p.endDate) return false
        const s = new Date(p.startDate)
        const e = new Date(p.endDate)
        return s <= today && today <= e
      })
      .sort(
        (a, b) =>
          new Date(a.startDate!).getTime() -
          new Date(b.startDate!).getTime()
      )

    if (ongoing.length > 0) return ongoing[0]
    const latestEnded = programs
      .filter((p) => p.endDate)
      .sort(
        (a, b) =>
          new Date(b.endDate!).getTime() -
          new Date(a.endDate!).getTime()
      )
    return latestEnded[0] || null
  }, [programs])

  const heroSrc = heroMedia?.url
  const heroPoster = heroMedia?.thumbnailUrl || heroSrc

  const parallaxProducts = useMemo(() => {
    const take = (artworks || []).filter((m) => m.thumbnailUrl || m.url)

    // shuffle artworks
    const shuffled = [...take]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // build program item
    const p = currentProgram
    const programItem = p
      ? (() => {
          const start = formatDate(p.startDate)
          const end = formatDate(p.endDate)
          const thumb =
            (p.media || [])
              .map((m) => m.thumbnailUrl || m.url)
              .find((src) => src && getMediaType(src) === "image") || ""

          return {
            title: p.title || "",
            subtitle: [start, end].filter(Boolean).join(" — "),
            link: `/programs/${p.id || p._id || ""}`,
            thumbnail: thumb,
          }
        })()
      : null

    // map artworks (ambil 11 kalau ada program)
    const items = shuffled
      .slice(0, programItem ? 11 : 12)
      .map((m) => {
        const artistName =
          artists.find((a) => a._id === m.artistId || (m as any).artist?._id === a._id)?.name || ""
        const year = m.year || ""
        return {
          title: m.title || "",
          subtitle: [artistName, year].filter(Boolean).join(" · "),
          link: `/artworks/${m.id || m._id || ""}`,
          thumbnail: m.thumbnailUrl || m.url,
        }
      })

    // inject program at position 6 (index 6)
    if (programItem) {
      items.splice(5, 0, programItem)
    }

    return items
  }, [artworks, artists, currentProgram])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden -mt-10">
        {loading && (
          <div className="h-screen w-full bg-muted animate-pulse" />
        )}
        {!loading && (
          <>
            {heroMedia && (heroMedia.type || '').startsWith('video') ? (
              <video
                src={heroSrc}
                poster={heroPoster}
                /*height screen minus 10 (topbar)*/
                className="h-screen relative w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : heroSrc ? (
              <div className="relative h-screen w-full bg-black">
                <img src={heroSrc} alt="Hero" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="absolute inset-0 bg-black/35" />
            <div className="max-w-7xl mx-auto absolute bottom-8 left-4 right-4 space-y-3 text-white">
              <p className="text-xs uppercase tracking-[0.2em]">Eat Dat 5hit Up!</p>
              <h1 className="font-[900] text-3xl leading-tight">Art R3d3fin3 th3 Uncommon</h1>
            </div>
          </>
        )}
      </section>

      {/* Hero Parallax gallery */}
      <section className="bg-[var(--edsu-white)]">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={`hero-skeleton-${idx}`} className="aspect-[4/3] bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <HeroParallax products={parallaxProducts} />
        )}
      </section>
    </div>
  )
}

/* eslint-disable react-hooks/exhaustive-deps */
