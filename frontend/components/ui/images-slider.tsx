"use client";
import { cn, getMediaType, imgproxy } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState } from "react";

export const ImagesSlider = ({
  images,
  children,
  overlay = true,
  overlayClassName,
  className,
  autoplay = true,
  direction = "up",
}: {
  images: string[];
  children: React.ReactNode;
  overlay?: React.ReactNode;
  overlayClassName?: string;
  className?: string;
  autoplay?: boolean;
  direction?: "up" | "down";
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const mediaItems = React.useMemo(
    () =>
      images.map((src) => {
        const type = getMediaType(src)
        return {
          src,
          type,
          proxySrc: type === "image" ? imgproxy(src, { w: 720, h: 0 }) : src,
        }
      }),
    [images]
  )

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 === images.length ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
  const targets = mediaItems
    .filter((x) => x.type === "image")
    .map((x) => x.proxySrc);

  if (targets.length === 0) {
    setLoadedImages([]);
    return;
  }

  const loadPromises = targets.map(
    (url) =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("load failed"));
      })
  );

  Promise.all(loadPromises)
    .then(setLoadedImages)
    .catch((err) => console.error("Failed to load images", err));
  }, [mediaItems]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        handleNext();
      } else if (event.key === "ArrowLeft") {
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // autoplay
    let interval: any;
    if (autoplay) {
      interval = setInterval(() => {
        handleNext();
      }, 5000);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  const slideVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      rotateX: 45,
    },
    visible: {
      scale: 1,
      rotateX: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.645, 0.045, 0.355, 1.0] as const,
      },
    },
    upExit: {
      opacity: 1,
      y: "-150%",
      transition: {
        duration: 1,
      },
    },
    downExit: {
      opacity: 1,
      y: "150%",
      transition: {
        duration: 1,
      },
    },
  };

  const areImagesLoaded =
    mediaItems.length > 0 &&
    mediaItems.every(
      (item) => item.type !== "image" || loadedImages.includes(item.proxySrc)
    );

  return (
    <div
      className={cn(
        "overflow-hidden h-full w-full relative flex justify-center",
        className
      )}
      style={{
        perspective: "1000px",
      }}
    >
      {areImagesLoaded && children}
      {areImagesLoaded && overlay && (
        <div
          className={cn("absolute inset-0 z-40", overlayClassName)}
        />
      )}

      {areImagesLoaded && (
        <AnimatePresence>
          {mediaItems[currentIndex]?.type === "video" ? (
            <motion.video
              key={currentIndex}
              src={mediaItems[currentIndex].src}
              initial="initial"
              animate="visible"
              exit={direction === "up" ? "upExit" : "downExit"}
              variants={slideVariants}
              className="image h-full w-full absolute inset-0 object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <motion.img
              key={currentIndex}
              src={mediaItems[currentIndex]?.proxySrc}
              initial="initial"
              animate="visible"
              exit={direction === "up" ? "upExit" : "downExit"}
              variants={slideVariants}
              className="image h-full w-full absolute inset-0 object-cover"
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
};