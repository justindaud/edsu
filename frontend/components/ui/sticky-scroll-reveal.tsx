"use client";
import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn, getMediaType } from "@/lib/utils";

export const StickyScroll = ({
  content,
  contentClassName,
  activeIndex,
  onActiveChange,
}: {
  content: {
    title: string;
    description: React.ReactNode;
    content?: React.ReactNode | any;
    backgroundSrc?: string;
    titleClassName?: string;
    descriptionClassName?: string;
  }[];
  contentClassName?: string;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<any>(null);
  const syncLockRef = useRef(false);
  const fromScrollRef = useRef(false);
  const activeCardRef = useRef(0);
  const cardLength = content.length;
  
  const bg = content[activeCard]?.backgroundSrc;
  const bgType = getMediaType(bg);

  useEffect(() => {
    const container = ref.current as HTMLElement | null;
    if (!container) return;

    const onScroll = () => {
      if (syncLockRef.current) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>("[data-sticky-index]")
      );
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      items.forEach((item) => {
        const idx = Number(item.dataset.stickyIndex || 0);
        const distance = Math.abs(item.offsetTop - container.scrollTop);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = idx;
        }
      });
      if (closestIndex === activeCardRef.current) return;
      activeCardRef.current = closestIndex;
      setActiveCard(closestIndex);
      fromScrollRef.current = true;
      onActiveChange?.(closestIndex);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [cardLength, onActiveChange, activeIndex]);

  useEffect(() => {
    if (typeof activeIndex === "number" && activeIndex !== activeCard) {
      activeCardRef.current = activeIndex;
      setActiveCard(activeIndex);
    }
  }, [activeIndex, activeCard]);

  useEffect(() => {
    if (typeof activeIndex !== "number") return;
    if (fromScrollRef.current && activeIndex === activeCard) {
      fromScrollRef.current = false;
      return;
    }
    const container = ref.current;
    if (!container) return;
    const target = container.querySelector(
      `[data-sticky-index="${activeIndex}"]`
    ) as HTMLElement | null;
    if (!target) return;
    syncLockRef.current = true;
    container.scrollTo({
      top: target.offsetTop - 12,
      behavior: "auto",
    });
    const raf = window.requestAnimationFrame(() => {
      syncLockRef.current = false;
    });
    return () => window.cancelAnimationFrame(raf);
  }, [activeIndex]);

  return (
    <div className="relative z-0 overflow-hidden">
      <AnimatePresence>
        {bg && bgType !== "video" && (
          <motion.div
            key={bg}
            className="pointer-events-none absolute inset-0 z-0 bg-contain bg-center lg:hidden"
            style={{ backgroundImage: `url(${bg})` }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
        {bg && bgType === "video" && (
          <motion.video
            key={`${bg}-video`}
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-contain lg:hidden"
            src={bg}
            muted
            loop
            playsInline
            autoPlay
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bg && (
          <motion.div
            key={`${bg}-overlay`}
            className="pointer-events-none absolute inset-0 z-[1] bg-[var(--edsu-white)] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0, duration: 5.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <motion.div
        className="relative z-10 w-full flex h-[28rem] items-start justify-center gap-6 overflow-y-auto text-[var(--foreground)] flex-row-reverse"
        ref={ref}
      >
        <div className="div relative z-10 flex items-start px-0">
          <div className="max-w-7xl">
            {content.map((item, index) => (
              <div
                key={item.title + index}
                className="my-[28rem] first:mt-4 last:mb-[20rem]"
                data-sticky-index={index}
              >
              <motion.h2
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className={cn(
                  "text-2xl font-bold text-[var(--edsu-pink)]",
                  item.titleClassName
                )}
              >
                {item.title}
              </motion.h2>
              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className={cn(
                  "text-kg mt-10 w-full text-[var(--edsu-black)]",
                  item.descriptionClassName
                )}
              >
                {item.description}
              </motion.p>
            </div>
          ))}
          </div>
        </div>
        <div
          className={cn(
            "sticky top-4 hidden h-full w-full  bg-[var(--card)] lg:block",
            contentClassName,
          )}
        >
          {content[activeCard].content ?? null}
        </div>
      </motion.div>
    </div>
  );
};
