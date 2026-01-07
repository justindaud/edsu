'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper, type IconProps } from '@/components/animate-ui/icons/icon';

type ArtworkProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    frame: {},
    stroke: {
      initial: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: { duration: 0.3, ease: 'easeInOut', delay: 0.18 },
      },
    },
    stroke2: {
      initial: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: { duration: 0.2, ease: 'easeInOut', delay: 1.18 },
      },
    },
    spark: {
      initial: { opacity: 0, scale: 0.6, rotate: -15 },
      animate: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: { duration: 0.1, ease: 'easeOut', delay: 1.5 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;


function IconComponent({ size, ...props }: ArtworkProps) {
  const { controls } = useAnimateIconContext();
  const v = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* frame */}
      <motion.rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
        variants={v.frame}
        initial="initial"
        animate={controls}
      />

      {/* bold diagonal composition (readable at small size) */}
      <motion.path
        d="M7.5 16.5l9-9"
        variants={v.stroke}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M9 10.8c1.2 1.1 2.3 2.3 3.4 3.5"
        variants={v.stroke2}
        initial="initial"
        animate={controls}
      />

      {/* spark mark (art “highlight”) */}
      <motion.path
        d="M16.8 15.2l.6 1.2 1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6 1.2-.6.6-1.2z"
        variants={v.spark}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Artwork(props: ArtworkProps) { return <IconWrapper icon={IconComponent} {...props} />; }

export { animations, Artwork, Artwork as ArtworkIcon, type ArtworkProps, type ArtworkProps as ArtworkIconProps };