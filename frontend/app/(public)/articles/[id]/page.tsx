"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconBrandX,
  IconShare,
} from "@tabler/icons-react";
import { fetchArticle, fetchArticles } from "@/lib/services";
import { getMediaType } from "@/lib/utils";
import type { Article } from "@/lib/types";

const renderFormattedText = (text: string) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const elements: ReactNode[] = [];
  let consecutiveEmptyLines = 0;

  const countSentences = (line: string) => {
    let count = 0;
    for (const match of line.matchAll(/[.!?]+/g)) {
      const idx = match.index ?? 0;
      const before = line.slice(0, idx).trimEnd();
      const wordMatch = before.match(/([A-Za-zÀ-ÿ0-9]+)$/);
      const word = wordMatch ? wordMatch[1] : "";
      if (word.length > 2) count += 1;
    }
    return count;
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      consecutiveEmptyLines += 1;
      if (consecutiveEmptyLines === 1) {
        elements.push(<div key={`space-${index}`} className="h-4" />);
      }
      return;
    }

    consecutiveEmptyLines = 0;

    const sentenceCount = countSentences(trimmedLine);
    const isParagraph = sentenceCount >= 2;

    elements.push(
      <p
        key={`para-${index}`}
        className={[
          "text-md whitespace-pre-wrap",
          isParagraph
            ? "[text-indent:2em] [text-align:justify] [text-align-last:left]"
            : "",
        ].join(" ")}
      >
        {trimmedLine}
      </p>
    );
  });

  return elements;
};

export default function ArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherArticles, setOtherArticles] = useState<Article[]>([]);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    fetchArticle(params.id as string)
      .then((res) => setArticle(res))
      .finally(() => setLoading(false));
    fetchArticles()
      .then((items) => {
        const currentId = String(params.id);
        const filtered = (items || []).filter((it) => {
          const id = String(it.id || it._id || "");
          return id && id !== currentId;
        });
        setOtherArticles(filtered);
      })
      .catch(() => setOtherArticles([]));
  }, [params?.id]);

  const cover = useMemo(() => {
    if (!article) return "";
    return (
      article.coverImage ||
      article.media?.[0]?.thumbnailUrl ||
      article.media?.[0]?.url ||
      ""
    );
  }, [article]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareUrl(window.location.href);
  }, [article]);

  const stripHtml = (value?: string) =>
    value ? value.replace(/<[^>]*>?/gm, "") : "";

  const getCover = (item: Article) =>
    item.coverImage || item.media?.[0]?.thumbnailUrl || item.media?.[0]?.url || "";

  const handleShare = (
    platform: "native" | "x" | "facebook" | "whatsapp"
  ) => {
    const text = article?.title || "Article";
    const url = shareUrl;
    if (!url) return;
    if (platform === "native" && navigator.share) {
      navigator.share({ title: text, text, url }).catch(() => undefined);
      return;
    }
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const shareLinks = {
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    };
    const target = shareLinks[platform as keyof typeof shareLinks];
    if (target) window.open(target, "_blank", "noopener,noreferrer");
  };

  const shuffledArticles = useMemo(() => {
    if (!otherArticles.length) return [];
    const items = [...otherArticles];
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [otherArticles]);

  if (!article && loading) {
    return (
      <main className="min-h-screen bg-[var(--edsu-white)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
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
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-[var(--edsu-white)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
        <p className="text-sm text-[var(--muted-foreground)]">
          Article not found.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--edsu-white)] px-4 sm:px-6 py-8 sm:py-10 w-full mx-auto">
      <header className="mb-6 space-y-2 text-[var(--edsu-pink)]">
        <h1 className="text-2xl sm:text-3xl font-[900] uppercase tracking-[0.16em]">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--edsu-black)]">
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
      </header>

      <div className="relative mx-auto mb-8 h-[60vh] w-full max-w-5xl overflow-hidden">
        {getMediaType(cover) === 'video' ? (
          <video
            src={cover}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : cover ? (
          <img
            src={cover}
            alt={article.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>

      <article className="mx-auto w-full max-w-5xl space-y-6 text-[var(--edsu-black)]">
        {article.content && (
          <div className="leading-relaxed">
            {renderFormattedText(article.content)}
          </div>
        )}
      </article>

      {shuffledArticles.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-lg font-[900] uppercase tracking-[0.16em] text-[var(--edsu-pink)]">
            Mor3 Articl35
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shuffledArticles.slice(0, 6).map((item) => {
              const itemCover = getCover(item);
              return (
                <Link
                  key={item.id || item._id}
                  href={`/articles/${item.id || item._id}`}
                  className="group block overflow-hidden"
                >
                  <div className="relative h-48 w-full bg-[var(--card)]">
                    {itemCover ? (
                      getMediaType(itemCover) === 'video' ? (
                        <video
                          src={itemCover}
                          className="h-full w-full object-cover"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      ) : (
                        <img
                          src={itemCover}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black text-xs uppercase tracking-[0.2em] text-white">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="text-sm font-semibold line-clamp-2 text-[var(--edsu-black)]">
                      {item.title}
                    </p>
                    <p className="text-xs leading-relaxed line-clamp-3 text-[var(--edsu-black)]">
                      {stripHtml(item.excerpt || item.content)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
