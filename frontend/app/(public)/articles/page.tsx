"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Timeline } from "@/components/ui/timeline"
import { fetchArticles } from "@/lib/services"
import { getMediaType } from "@/lib/utils"
import { BlurFade } from "@/components/ui/blur-fade"
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll"

import type { Article } from "@/lib/types"

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
      .then((ar) => setArticles(ar || []))
      .finally(() => setLoading(false))
  }, [])

  const timelineItems = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .map((ar) => {
        const cover =
          ar.coverImage ||
          ar.media?.[0]?.thumbnailUrl ||
          ar.media?.[0]?.url
        const coverType = getMediaType(cover)

        const excerpt =
          ar.excerpt ||
          ar.content?.replace(/<[^>]*>?/gm, '').slice(0, 160) ||
          ''

        return {
          title: ar.title,
          content: (
            <div className="bg-[var(--card)] text-[var(--edsu-pink)] space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <BlurFade>
                  <Link
                    href={`/articles/${ar._id || ar.id || ''}`}
                    className="relative block w-full h-72 overflow-hidden justify-center"
                  >
                    <div className=" w-full h-full relative flex overflow-hidden ">
                      {coverType === 'video' ? (
                        <video
                          src={cover}
                          className="h-full w-full object-contain"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      ) : cover ? (
                        <img
                          src={cover}
                          alt={ar.title}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="flex-1 space-y-3 pt-8">
                    <Link href={`/articles/${ar._id || ar.id || ''}`} className="space-y-2 block">
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)] line-clamp-3">
                      {ar.content?.replace(/<[^>]*>?/gm, '')}
                    </p>
                    </Link>
                  </div>
                  <Link
                    href={`/programs/${ar._id || ar.id || ''}`}
                    className="inline-flex text-sm font-semibold text-[var(--primary)] underline underline-offset-4"
                  >
                    Continue reading
                  </Link>
                </BlurFade>
              </div>
            </div>
          ),
        }
      })
  }, [articles])

  return (
    <main className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-pink)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-[900] uppercase tracking-[0.16em]">Article5</h1>
      </header>

      {loading && (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`article-skeleton-${idx}`} className="space-y-3">
              <div className="h-6 w-40 bg-muted animate-pulse" />
              <div className="h-40 w-full bg-muted animate-pulse" />
              <div className="h-4 w-3/4 bg-muted animate-pulse" />
              <div className="h-4 w-1/2 bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && timelineItems.length > 0 && (
        <RevealOnScroll effect="blurIn">
          <Timeline data={timelineItems} />
        </RevealOnScroll>
      )}
      
    </main>
  )
}
