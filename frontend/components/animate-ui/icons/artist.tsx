'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper, type IconProps } from '@/components/animate-ui/icons/icon';

type ArtistProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    head: {},
    beret: {},
    accent: {
      initial: { opacity: 0, rotate: -6, transformOrigin: '12px 7px' },
      animate: {
        opacity: 1,
        rotate: [ -4, 0 ],
        transition: { duration: 0.25, ease: 'easeOut', delay: 2.25 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;


function IconComponent({ size, ...props }: ArtistProps) {
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
      {/* head */}
      <motion.circle
        cx="12"
        cy="12"
        r="3.2"
        variants={v.head}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M6.8 20c1.6-3.1 4.1-4.6 5.2-4.6s3.6 1.5 5.2 4.6"
        variants={v.head}
        initial="initial"
        animate={controls}
      />

      {/* beret (clear silhouette) */}
      <motion.path
        d="M7.2 9.3c.6-2.4 2.8-3.9 5.4-3.9 2.9 0 4.8 1.2 5.2 3.2"
        variants={v.beret}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M7 9.4h10.6c0 1.8-2.2 3-5.3 3S7 11.2 7 9.4z"
        variants={v.beret}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M13.2 5.4l1-1.2"
        variants={v.accent}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Artist(props: ArtistProps) { return <IconWrapper icon={IconComponent} {...props} />; }

export { animations, Artist, Artist as ArtistIcon, type ArtistProps, type ArtistProps as ArtistIconProps };