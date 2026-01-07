'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type BookProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    cover: {},
    line1: {
      initial: {
        pathLength: 1,
        opacity: 1
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
          delay: 0.7
        },
      },
    },
    line2: {
      initial: {
        pathLength: 1,
        opacity: 1
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
            duration: 0.6,
            ease: 'easeInOut',
            delay: 0.7
        },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: BookProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

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
      {/* cover (left+right) */}
      <motion.path
        d="M4 19.5V6a2 2 0 0 1 2-2h4c1 0 2 .4 2 1.2V20c0-.8-1-1.2-2-1.2H6a2 2 0 0 0-2 2z"
        variants={variants.cover}
        initial="initial"
        animate={controls}
      />

      <motion.path
        d="M20 19.5V6a2 2 0 0 0-2-2h-4c-1 0-2 .4-2 1.2V20c0-.8 1-1.2 2-1.2h4a2 2 0 0 1 2 2z"
        variants={variants.cover}
        initial="initial"
        animate={controls}
      />

      {/* page lines (optional) */}

      <motion.path
        d="M12 9h4"
        variants={variants.line1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M12 13h4"
        variants={variants.line2}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Book(props: BookProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Book,
  Book as BookIcon,
  type BookProps,
  type BookProps as BookIconProps,
};