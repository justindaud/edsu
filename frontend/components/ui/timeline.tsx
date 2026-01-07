"use client";
import {
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import React, { useLayoutEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({
  data
}: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
  if (!ref.current) return;
  const el = ref.current;
  const measure = () => setHeight(el.getBoundingClientRect().height);
  measure(); // initial
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  return () => ro.disconnect();
}, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full"
      ref={containerRef}
    >
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pb-20"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start w-[30vw] md:max-w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-[var(--edsu-pink)] border border-[var(--edsu-pink)] p-2" />
              </div>
              <h1 className="hidden md:block text-4xl md:pl-20 md:text-2xl font-bold text-[var(--edsu-pink)]">
                {item.title}
              </h1>
            </div>

            <div className="relative pl-4 pr-4 md:pl-4 w-full">
              <h1 className="md:hidden block text-2xl mb-4 text-left font-bold text-[var(--edsu-pink)]">
                {item.title}
              </h1>
              {item.content}{" "}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[90%] via-[var(--edsu-white)] to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_70%,transparent_90%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-[var(--edsu-pink)] via-[var(--edsu-pink)] to-transparent from-[90%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
