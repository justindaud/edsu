'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper, type IconProps } from '@/components/animate-ui/icons/icon';

export const draw = (delay = 0): Variants => ({
  initial: { pathLength: 1, opacity: 1, scale: 1 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    scale: [1.05, 1],
    transition: { duration: 2, ease: "easeInOut", delay },
  },
});

type ArticleProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    outline: {},
    fold: {},
    line1: {
      initial: { opacity: 0, x: -2 },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 2, ease: 'easeOut', delay: 0.22 },
      },
    },
    line2: {
      initial: { opacity: 0, x: -2 },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 2.22, ease: 'easeOut', delay: 0.3 },
      },
    },
    line3: {
      initial: { opacity: 0, x: -2 },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 2.22, ease: 'easeOut', delay: 0.38 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ArticleProps) {
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
      {/* paper with fold */}
      <motion.path
        d="M12 4h7l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        variants={v.outline}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M14 4v3a1 1 0 0 0 1 1h3"
        variants={v.fold}
        initial="initial"
        animate={controls}
      />

      {/* content blocks */}
      <motion.rect
        x="8"
        y="9"
        width="4.6"
        height="4.6"
        rx="1"
        variants={v.outline}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M15 12h4"
        variants={v.line1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M15.5 14.5h4"
        variants={v.line2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M8 18h10"
        variants={v.line3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Article(props: ArticleProps) { return <IconWrapper icon={IconComponent} {...props} />; }

export { animations, Article, Article as ArticleIcon, type ArticleProps, type ArticleProps as ArticleIconProps };