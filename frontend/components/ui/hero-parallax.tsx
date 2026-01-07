"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import { getMediaType } from "@/lib/utils";



export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    subtitle?: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 4);
  const secondRow = products.slice(4, 8);
  const thirdRow = products.slice(8, 12);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 120, damping: 30, mass: 0.8 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [60, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.25], [-700, 200]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="h-[300vh] py-8 overflow-hidden  antialiased relative flex flex-col self-auto [perspective:1500px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="transform-gpu will-change-transform"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-10 mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={`${product.link}-${product.thumbnail}`}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row  mb-20 space-x-10 ">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={`${product.link}-${product.thumbnail}`}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-10">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={`${product.link}-${product.thumbnail}`}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-4 md:py-8 w-full px-4 left-0 top-0">
      <h1 className="text-2xl md:text-7xl font-bold text-[var(--edsu-pink)] mb-6">
        EDSU
      </h1>
      <p className="max-w-2xl text-base md:text-xl text-[var(--edsu-pink)] font-bold mb-4">
        bukan sekadar galeri yang memajang benda seni.
      </p>
      <p className="max-w-2xl text-base md:text-xl text-[var(--edsu-pink)] mb-8">
        melainkan panggung bagi eksperimen: tempat gagasan diuji, dipertanyakan,
        bahkan dibiarkan runtuh hanya untuk dibangun kembali dengan cara yang lebih liar.
      </p>
      <p className="max-w-2xl text-base md:text-xl text-[var(--edsu-pink)] font-bold mb-4">
        tidak dibangun untuk yang menginginkan kepastian.
      </p>
      <p className="max-w-2xl text-base md:text-xl text-[var(--edsu-pink)] mb-8">
        melainkan tempat bagi yang ragu, yang gemar menantang batas pikirannya sendiri.
      </p>
      <p className="max-w-2xl text-base md:text-xl text-[var(--edsu-pink)] font-bold mb-4">
        seni bukan sekadar barang dagangan atau dekorasi.
      </p>
      <p className="max-w-2xl text-base md:text-xl text-[var(--edsu-pink)] mb-8">
        melainkan medan yang terus bergerak—mengajak kita bertanya,
        menyusun jawaban, lalu meruntuhkannya lagi.
      </p>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    subtitle?: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      className="group/product h-[22rem] w-[30rem] relative shrink-0 transform-gpu will-change-transform"
    >
      <a
        href={product.link}
        className="block group-hover/product:shadow-2xl "
      >
        {getMediaType(product.thumbnail) === "video" ? (
          <video
            src={product.thumbnail}
            className="object-contain object-center absolute h-full w-full inset-0"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={product.thumbnail}
            height="400"
            width="400"
            className="object-contain object-center absolute h-full w-full inset-0"
            alt={product.title}
          />
        )}
      </a>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <div className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white space-y-1">
        <h2 className="text-lg font-semibold leading-tight">{product.title}</h2>
        {product.subtitle && (
          <p className="text-xs text-white/80">
            {product.subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};
