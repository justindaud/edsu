"use client";
import React, { useState}  from "react";
import {JSX} from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { cn } from "@/lib/utils";


export const FloatingNav = ({
  navItems,
  className,
  forceShow = false,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
  }[];
  className?: string;
  forceShow?: boolean;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (forceShow) return;
    if (typeof current === "number") {
      const direction = current - (scrollYProgress.getPrevious() ?? 0);
      if (scrollYProgress.get() < 0.05) {
        setVisible(false);
      } else {
        setVisible(direction < 0);
      }
    }
  });

  const isVisible = forceShow || visible;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-fit fixed top-10 inset-x-0 mx-auto bg-[var(--edsu-pink)] z-[5000] pr-2 pl-2 py-2  items-center justify-center space-x-4 font-bold",
          className
        )}
      >
        {navItems.map((navItem: any, idx: number) => {
          const isActive =
            pathname === navItem.link ||
            (navItem.link !== "/" && pathname?.startsWith(navItem.link));
          return (
            <a
              key={`link=${idx}`}
              href={navItem.link}
              className={cn(
                "relative items-center flex space-x-1 text-neutral-100 px-1 py-1 transition-colors",
                isActive
                  ? "bg-[var(--edsu-green)] text-[var(--edsu-pink)]"
                  : "hover:bg-white/15"
              )}
            >
              <span className="block pl-1">{navItem.icon}</span>
              <span className="hidden pr-1 sm:block text-sm">{navItem.name}</span>
            </a>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};
