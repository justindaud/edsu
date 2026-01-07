'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper, type IconProps } from '@/components/animate-ui/icons/icon';

export const draw = (delay = 0): Variants => ({
  initial: { pathLength: 1, opacity: 1, scale: 1 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    scale: [1.1, 1],
    transition: { duration: 1, ease: "easeInOut", delay: delay},
  },
});

type HomeProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    path2: {
      initial: {
        pathLength: 1,
        opacity: 1,
        scale: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        scale: [1.1, 1],
        transition: {
          duration: 1,
          ease: 'easeInOut',
        },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: HomeProps) {
  const { controls } = useAnimateIconContext();
  const v = getVariants(animations);

  return (
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <motion.path d="M4 10.5 12 4l8 6.5" variants={v.path2} initial="initial" animate={controls} />
      <motion.path d="M6 10v10h12V10" variants={v.path1} initial="initial" animate={controls} />
      <motion.path d="M10 20v-6h4v6" variants={v.path1} initial="initial" animate={controls} />
    </motion.svg>
  );
}

function Home(props: HomeProps) { return <IconWrapper icon={IconComponent} {...props} />; }

export { animations, Home, Home as HomeIcon, type HomeProps, type HomeProps as HomeIconProps };