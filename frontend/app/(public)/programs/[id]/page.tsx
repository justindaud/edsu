/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchProgram, fetchPrograms, fetchArtists } from '@/lib/services'
import { getMediaType } from '@/lib/utils'
import type { Artist, Program } from '@/lib/types'
import { BlurFade } from '@/components/ui/blur-fade'
import { ImagesSlider } from '@/components/ui/images-slider'
import { StickyScroll } from '@/components/ui/sticky-scroll-reveal'
import { FlipReveal, FlipRevealItem } from '@/components/ui/flip-reveal'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconBrandX,
  IconShare,
} from "@tabler/icons-react";

const formatDate = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ProgramDetail() {
  const params = useParams<{ id: string }>()
  const [program, setProgram] = useState<Program | null>(null)
  const [otherPrograms, setOtherPrograms] = useState<Program[]>([])
  const [allArtists, setAllArtists] = useState<Artist[]>([])
  const [stickyIndex, setStickyIndex] = useState(0)
  const [activeArticleIndex, setActiveArticleIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return
      try {
        const [p, programs, artists] = await Promise.all([
          fetchProgram(params.id as string),
          fetchPrograms().catch(() => []),
          fetchArtists().catch(() => []),
        ])
        setProgram(p)
        setOtherPrograms((programs || []).filter((item) => (item.id || item._id) !== (p.id || p._id)))
        setAllArtists(artists || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setShareUrl(window.location.href)
  }, [program])

  const mediaList = [...(program?.media || [])]
  const sliderImages = mediaList.map((m) => m.thumbnailUrl || m.url).filter(Boolean) as string[]
  const start = formatDate(program?.startDate)
  const end = formatDate(program?.endDate)
  const articles = program?.articles || []
  const artworks = program?.artworks || []

  const artists = useMemo(() => {
    const artistIndex = new Map<string, Artist>()
    allArtists.forEach((a) => {
      const id = a._id || (a as any).id
      if (id) artistIndex.set(id, a)
    })

    const artistMap = new Map<string, Artist & { id: string }>()
    artworks.forEach((aw) => {
      const a = (aw as any).artist || null
      const id = a?._id || a?.id || aw.artistId || (aw as any).artist_id
      if (!id) return
      const resolved = artistIndex.get(String(id))
      const name = resolved?.name || a?.name || ''
      const photo = resolved?.photo || a?.photo || null
      if (!artistMap.has(String(id))) {
        artistMap.set(String(id), { ...(resolved || a), _id: String(id), id: String(id), name, photo })
      }
    })
    return Array.from(artistMap.values())
  }, [allArtists, artworks])

  useEffect(() => {
    if (articles.length && activeArticleIndex >= articles.length) {
      setActiveArticleIndex(0)
    }
  }, [articles, activeArticleIndex])

  const activeArtistIndex = stickyIndex - 1
  const activeArtistId =
    activeArtistIndex >= 0
      ? artists[activeArtistIndex]?._id || (artists[activeArtistIndex] as any)?.id
      : null
  const getArtworkArtistId = (aw: any) =>
    aw.artistId || aw.artist?._id || aw.artist_id || null

  const shuffledArtworks = useMemo(() => {
    if (!artworks.length) return []
    const items = [...artworks]
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }, [artworks])

  const programCover = useMemo(
    () => sliderImages.find((src) => getMediaType(src) === 'image') || sliderImages[0] || '',
    [sliderImages]
  )

  const stickyContent = useMemo(() => {
    const range = [start, end].filter(Boolean).join(' — ')
    const programCard = {
      title: program?.title || '',
      description: (
        <>
          {range && (
            <span className="block text-sm font-semibold tracking-[0.12em] text-[var(--edsu-pink)]">
              {range}
            </span>
          )}
          {program?.description && (
            <span className="mt-4 block whitespace-pre-line text-[var(--edsu-black)]">
              {program.description}
            </span>
          )}
        </>
      ),
      backgroundSrc: programCover,
      titleClassName: "text-2xl sm:text-3xl font-[900] uppercase tracking-[0.16em] text-[var(--edsu-pink)]",
      content: (
        <div className="relative h-full w-full overflow-hidden">
          <ImagesSlider images={sliderImages} overlay={false} autoplay={true}>
            <div />
          </ImagesSlider>
        </div>
      ),
    }
    const artistCards = artists.map((a) => {
      const avatar =
        (a.photo as any)?.thumbnailUrl ||
        (a.photo as any)?.url ||
        artworks.find((m) => (m.artistId || (m as any).artist?._id) === (a._id || (a as any).id))?.thumbnailUrl ||
        artworks.find((m) => (m.artistId || (m as any).artist?._id) === (a._id || (a as any).id))?.url ||
        ''
      const avatarType = getMediaType(avatar, (a.photo as any)?.type)
      const avatarImage = avatarType === 'image' ? avatar : ''
      return {
        title: a.name,
        description: (
          <>
            <span className="block line-clamp-3">
              {(a.description || '').replace(/<[^>]*>?/gm, '')}
            </span>
            <Link
              href={`/artists/${a._id || (a as any).id || ''}`}
              className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.16em] !text-[var(--edsu-pink)]"
            >
              - See More
            </Link>
          </>
        ),
        backgroundSrc: avatarImage || programCover,
        content: (
          <Link
            href={`/artists/${a._id || (a as any).id || ''}`}
            className="block h-full w-full"
          >
            {avatar && avatarType !== 'video' ? (
              <img
                src={avatar}
                alt={a.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : avatar ? (
              <video
                src={avatar}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : null}
          </Link>
        ),
      }
    })
    const backtotop = {
      title: program?.title || '',
      description: (
        <>
          {range && (
            <span className="block text-sm font-semibold tracking-[0.12em] text-[var(--edsu-pink)]">
              {range}
            </span>
          )}
        </>
      ),
      backgroundSrc: programCover,
      content: (
        <button
          type="button"
          onClick={() => setStickyIndex(0)}
          className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-[var(--edsu-pink)]"
        >
          Back to Top
        </button>
      ),
    }
    return [programCard, ...artistCards, backtotop]
  }, [program, start, end, sliderImages, artists, artworks])

  const handleShare = (platform: "native" | "x" | "facebook" | "whatsapp") => {
    const text = program?.title || "Program"
    const url = shareUrl
    if (!url) return
    if (platform === "native" && navigator.share) {
      navigator.share({ title: text, text, url }).catch(() => undefined)
      return
    }
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(text)
    const shareLinks = {
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    }
    const target = shareLinks[platform as keyof typeof shareLinks]
    if (target) window.open(target, "_blank", "noopener,noreferrer")
  }

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
  if (!program) return <div className="p-6 text-sm text-muted-foreground"></div>


  return (
    <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] p-4 sm:px-6 w-full mx-auto">
      <StickyScroll
        content={stickyContent}
        contentClassName="bg-transparent"
        activeIndex={stickyIndex}
        onActiveChange={setStickyIndex}
      />
      {program && (
        <div className="mt-4 flex flex-wrap justify-end items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--edsu-black)]">
          <button
            type="button"
            onClick={() => handleShare("native")}
            className="inline-flex items-center justify-center"
            aria-label="Share"
          >
            <IconShare size={16} stroke={1.8} />
          </button>
          <button
            type="button"
            onClick={() => handleShare("x")}
            className="inline-flex items-center justify-center"
            aria-label="Share to X"
          >
            <IconBrandX size={16} stroke={1.8} />
          </button>
          <button
            type="button"
            onClick={() => handleShare("facebook")}
            className="inline-flex items-center justify-center"
            aria-label="Share to Facebook"
          >
            <IconBrandFacebook size={16} stroke={1.8} />
          </button>
          <button
            type="button"
            onClick={() => handleShare("whatsapp")}
            className="inline-flex items-center justify-center"
            aria-label="Share to WhatsApp"
          >
            <IconBrandWhatsapp size={16} stroke={1.8} />
          </button>
        </div>
      )}
      <div className="space-y-12">
        {artists.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-[900] uppercase tracking-[0.2em] text-[var(--edsu-black)]">
              Arti5t5
            </h2>
            <ToggleGroup
              type="single"
              value={stickyIndex === 0 ? "all" : String(activeArtistIndex)}
              onValueChange={(val) => {
                if (val === "") return
                if (val === "all") {
                  setStickyIndex(0)
                  return
                }
                const next = Number(val)
                if (!Number.isNaN(next)) setStickyIndex(next + 1)
              }}
              className="flex flex-wrap items-center justify-start gap-2"
            >
              {artists.map((artist, idx) => (
                <ToggleGroupItem
                  key={artist._id || (artist as any).id}
                  value={String(idx)}
                  className="bg-transparent shadow-none text-xs uppercase tracking-[0.16em] text-[var(--foreground)] sm:px-4 text-left whitespace-normal items-start justify-start h-auto data-[state=on]:bg-transparent data-[state=on]:text-[var(--edsu-pink)]"
                >
                  {artist.name}
                </ToggleGroupItem>
              ))}
                <ToggleGroupItem
                  value="all"
                  onClick={() => setStickyIndex(0)}
                  className="bg-transparent shadow-none text-xs uppercase tracking-[0.16em] text-[var(--foreground)] sm:px-4 text-left whitespace-normal items-start justify-start h-auto data-[state=on]:bg-transparent data-[state=on]:text-[var(--edsu-pink)]"
                >
                  All
                </ToggleGroupItem>
            </ToggleGroup>

              <FlipReveal
                keys={activeArtistId ? [String(activeArtistId)] : ['all']}
                showClass="block"
                hideClass="hidden"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
              >
                {shuffledArtworks.map((aw) => {
                  const isVideo = aw.isVideo || aw.mediaType === 'video' || getMediaType(aw.url, aw.type) === 'video'
                  const src = isVideo ? aw.url : (aw.thumbnailUrl || aw.url || '')
                  const flipKey = getArtworkArtistId(aw) || 'all'
                  return (
                    <FlipRevealItem key={aw.id || aw._id} flipKey={String(flipKey)}>
                      <Link
                        href={`/artworks/${aw.id || aw._id}`}
                        className="group block overflow-hidden bg-[var(--card)] hover:-translate-y-1 transition-transform"
                      >
                      <div className="relative h-[20vh] w-full">
                        {src && !isVideo ? (
                          <img
                            src={src}
                            alt={aw.title || ''}
                            className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        ) : src ? (
                          <video
                            src={src}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : null}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{aw.year || ''}</p>
                        <p className="text-sm font-semibold line-clamp-2">{aw.title || 'Untitled'}</p>
                      </div>
                    </Link>
                  </FlipRevealItem>
                )
              })}
            </FlipReveal>
          </div>
        )}
        
        {articles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-[900] uppercase tracking-[0.2em] text-[var(--edsu-black)]">
              R3lat3d Articl35
            </h2>
            <StickyScroll
              activeIndex={activeArticleIndex}
              onActiveChange={setActiveArticleIndex}
              contentClassName="bg-transparent"
              content={articles.map((article) => ({
                title: article.title,
                description: (
                  <>
                    <span className="block line-clamp-3">
                      {( article.content || '').replace(/<[^>]*>?/gm, '')}
                    </span>
                    <Link
                      href={`/articles/${article.id || article._id}`}
                      className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.16em] !text-[var(--edsu-pink)]"
                    >
                      - Read More
                    </Link>
                  </>
                ),
                backgroundSrc: getMediaType(article.coverImage) === 'image' ? article.coverImage : programCover,
                content: (
                  <Link
                    href={`/articles/${article.id || article._id}`}
                    className="block h-full w-full"
                  >
                    {article.coverImage && getMediaType(article.coverImage) === 'video' ? (
                      <video
                        src={article.coverImage}
                        className="h-full w-full object-cover"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                    ) : article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </Link>
                ),
              }))}
            />
                        <ToggleGroup
              type="single"
              value={String(activeArticleIndex)}
              onValueChange={val => setActiveArticleIndex(Number(val))}
              className="flex flex-wrap items-center justify-start gap-2"
            >
              {articles.map((article, idx) => (
                <ToggleGroupItem
                  key={article.id || article._id}
                  value={String(idx)}
                  className="bg-transparent shadow-none text-xs uppercase tracking-[0.16em] text-[var(--foreground)] sm:px-4 text-left whitespace-normal items-start justify-start h-auto data-[state=on]:bg-transparent data-[state=on]:text-[var(--edsu-pink)]"
                >
                  {article.title}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}

        {otherPrograms.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-[900] uppercase tracking-[0.2em] text-[var(--edsu-black)]">
              Oth3r Program5
            </h2>
            <div className="grid gap-4 sm:gap-3 md:grid-cols-3">
              {otherPrograms.map((p, idx) => {
                const cover = (p.media?.[0] || p.artworks?.[0]) as any
                const coverSrc = cover?.thumbnailUrl || cover?.url || ''
                const coverIsVideo = getMediaType(coverSrc, cover?.type) === 'video'
                const pStart = formatDate(p.startDate)
                const pEnd = formatDate(p.endDate)
                return (
                  <BlurFade key={p.id || p._id} delay={idx * 0.04}>
                    <Link
                      href={`/programs/${p.id || p._id}`}
                      className="group block overflow-hidden hover:-translate-y-1 transition-transform"
                    >
                      <div className="relative h-[30vh] w-full">
                        {coverIsVideo ? (
                          <video
                            src={coverSrc}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <img
                            src={coverSrc}
                            alt={p.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-semibold">
                          {p.title}
                        </p>
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--edsu-pink)]">
                          {[pStart, pEnd].filter(Boolean).join(' — ')}
                        </p>
                        <p className="text-xs tracking-[0.12em] text-[var(--edsu-black)] line-clamp-3">
                          {p.description || ''}
                        </p>
                      </div>
                    </Link>
                  </BlurFade>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
