"use client";

import React, { useState, useRef } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import { cn, getMediaType } from "@/lib/utils";

export type AnimatedTooltipItem = {
  id: number;
  name: string;
  designation: string;
  image?: string;
  fallback?: string;
  href?: string;
};

export type AnimatedTooltipProps = {
  items: AnimatedTooltipItem[];
  compact?: boolean;
};

export const AnimatedTooltip = ({ items, compact = false }: AnimatedTooltipProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );

  const handleMouseMove = (event: any) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const halfWidth = event.target.offsetWidth / 2;
      x.set(event.nativeEvent.offsetX - halfWidth);
    });
  };

  const shouldShow = (id: number) =>
    hoveredIndex === id || pressedIndex === id;

  const avatarSize =
    "relative !m-0 aspect-square h-10 w-10 rounded-full border-2 border-white transition duration-500 group-hover:z-30 group-hover:scale-105";

  return (
    <>
      {items.map((item) => (
        <div
          className={cn(
            "group relative",
            compact ? "mr-2" : "-mr-3 sm:-mr-4"
          )}
          key={item.name}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() =>
            setPressedIndex((prev) => (prev === item.id ? null : item.id))
          }
        >
          <AnimatePresence>
            {shouldShow(item.id) && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl"
              >
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-[var(--edsu-pink)] to-transparent" />
                <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-[var(--edsu-pink)] to-transparent" />
                <div className="relative z-30 text-base font-bold text-white">
                  {item.name}
                </div>
                <div className="text-xs text-white">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {item.image ? (
            <a href={item.href || "#"} aria-label={item.name}>
              {getMediaType(item.image) === "video" ? (
                <video
                  onMouseMove={handleMouseMove}
                  src={item.image}
                  className={cn(avatarSize, "!p-0", "object-cover object-top")}
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  onMouseMove={handleMouseMove}
                  height={100}
                  width={100}
                  src={item.image}
                  alt={item.name}
                  className={cn(avatarSize, "!p-0", "object-cover object-top")}
                />
              )}
            </a>
          ) : (
            <a
              href={item.href || "#"}
              aria-label={item.name}
              className={cn(
                avatarSize,
                "flex items-center justify-center bg-[var(--edsu-green)] text-[var(--edsu-black)] font-heading font-[900] text-sm sm:text-base"
              )}
            >
              {item.fallback || item.name?.[0] || "?"}
            </a>
          )}
        </div>
      ))}
    </>
  );
};
