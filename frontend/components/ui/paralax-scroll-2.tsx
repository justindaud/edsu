"use client";
import { useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { motion } from "motion/react";
import { Lens } from "@/components/ui/lens";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn, getMediaType, imgproxy } from "@/lib/utils";
import { FlipCard } from "@/components/ui/flip-card";

export const ParallaxScroll = ({
  images,
  items,
  className,
  variant = "lens",
}: {
  images?: string[];
  items?: { src: string; href?: string; render?: React.ReactNode; back?: React.ReactNode }[];
  className?: string;
  variant?: "lens" | "flip";
}) => {
  const gridRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({});
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  const translateOdd = useTransform(scrollYProgress, [0, 1], [0, 500]);
  const translateEven = useTransform(scrollYProgress, [0, 1], [0, -500]);

  const list = items ?? (images || []).map((src) => ({ src }));

  const fifth = Math.ceil(list.length / 5);
  const third = Math.ceil(list.length / 3);
  const second = Math.ceil(list.length / 2);

  // We'll slice for 5 cols (lg) and reuse for 3 cols (md) by combining.
  const firstPart5 = list.slice(0, fifth);
  const secondPart5 = list.slice(fifth, 2 * fifth);
  const thirdPart5 = list.slice(2 * fifth, 3 * fifth);
  const fourthPart5 = list.slice(3 * fifth, 4 * fifth);
  const fifthPart5 = list.slice(4 * fifth, 5 * fifth);

  // For (3 cols) combine the 5 slices into 3 arrays //...fifthPart5
  const colA = list.slice(0, third);
  const colB = list.slice(third, 2 * third);
  const colC = list.slice(2 * third, 3 * third);

  // for 2 cols combine the 5 slices into 2 arrays
  const col1 = list.slice(0, second);
  const col2 = list.slice(second, 2 * second);

  const renderItem = (
    el: { src: string; href?: string; render?: React.ReactNode; back?: React.ReactNode },
    idx: number,
    motionStyle: any,
    keyPrefix: string
  ) => {
    const mediaType = getMediaType(el.src);
    const isVideo = mediaType === "video";
    const baseMedia = isVideo ? (
      <video
        src={el.src}
        className="h-full w-full object-contain object-left-top gap-10 !m-0 !p-0"
        muted
        loop
        playsInline
        autoPlay
      />
    ) : (
      <img
        src={imgproxy(el.src, { w: 400 })}
        className="h-full w-full object-contain object-left-top gap-10 !m-0 !p-0"
        height="400"
        width="400"
        alt="thumbnail"
      />
    );
    const base = el.render ? (
      el.href ? <a href={el.href}>{el.render}</a> : el.render
    ) : el.href ? (
      <a href={el.href}>{baseMedia}</a>
    ) : (
      baseMedia
    );

    return (
      <motion.div style={{ y: motionStyle }} key={`${keyPrefix}-${idx}`}>
        <BlurFade key={el.src} delay={0.25 + idx * 0.05} inView>
          {variant === "flip" ? (
            <FlipCard
              className="h-full w-full"
              front={el.render ?? baseMedia}
              back={
                el.back ?? (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--edsu-white)] text-xs uppercase tracking-[0.2em] text-[var(--edsu-pink)]">
                    Details
                  </div>
                )
              }
            />
          ) : isTouch || isVideo ? (
            base
          ) : (
            <Lens
              zoomFactor={3}
              lensSize={150}
              isStatic={false}
              ariaLabel="Zoom Area"
            >
              {base}
            </Lens>
          )}
        </BlurFade>
      </motion.div>
    );
  };

  return (
    <div
      className={cn("items-start overflow-y-auto w-full", className)}
      ref={gridRef}
    >
      <div className="hidden lg:grid grid-cols-5 items-start max-w-7xl mx-auto gap-10 py-20 px-10" ref={gridRef}>
        <div className="grid gap-10">
          {firstPart5.map((el, idx) => renderItem(el, idx, translateOdd, "grid-1"))}
        </div>
        <div className="grid gap-10">
          {secondPart5.map((el, idx) => renderItem(el, idx, translateEven, "grid-2"))}
        </div>
        <div className="grid gap-10">
          {thirdPart5.map((el, idx) => renderItem(el, idx, translateOdd, "grid-3"))}
        </div>
        <div className="grid gap-10">
          {fourthPart5.map((el, idx) => renderItem(el, idx, translateEven, "grid-4"))}
        </div>
        <div className="grid gap-10">
          {fifthPart5.map((el, idx) => renderItem(el, idx, translateOdd, "grid-5"))}
        </div>
      </div>

      <div className="hidden md:grid lg:hidden md:grid-cols-3 items-start max-w-7xl mx-auto gap-8 py-12 px-6">
        <div className="grid gap-8">
          {colA.map((el, idx) => renderItem(el, idx, translateOdd, "col1"))}
        </div>
        <div className="grid gap-8">
          {colB.map((el, idx) => renderItem(el, idx, translateEven, "col2"))}
        </div>
        <div className="hidden md:grid gap-8">
          {colC.map((el, idx) => renderItem(el, idx, translateOdd, "colC"))}
        </div>
      </div>

      <div className="grid md:hidden lg:hidden grid-cols-2 items-start max-w-7xl mx-auto gap-8 py-12 px-6">
        <div className="grid gap-8">
          {col1.map((el, idx) => renderItem(el, idx, translateOdd, "col1"))}
        </div>
        <div className="grid gap-8">
          {col2.map((el, idx) => renderItem(el, idx, translateEven, "col2"))}
        </div>
      </div>
    </div>
  );
};
