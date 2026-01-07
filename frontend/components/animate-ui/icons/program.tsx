'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper, type IconProps } from '@/components/animate-ui/icons/icon';

type ProgramProps = IconProps<keyof typeof animations>;


const animations = {
  default: {
    frame: {},
    art: {
      initial: { opacity: 0, scale: 0.96 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.28, ease: 'easeOut', delay: 0.18 },
      },
    },
    posts: {},
    rope: {
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 2,
          ease: 'easeInOut',
          delay: 0.2
        },
      },
    },
    rope2: {
      // subtle second rope (optional, feels premium)
      initial: {
        pathLength: 1,
        opacity: 1,
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.45,
          ease: 'easeInOut',
          delay: 0.08,
        },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ProgramProps) {
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
      {/* left post */}
      <motion.path
        d="M1 20v-15"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx="6"
        cy="3"
        r="1"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />

      <motion.path
        d="M1.1 20h1.6"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />

      {/* center post */}
      <motion.path
        d="M12 20v-15"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx="18"
        cy="3"
        r="1"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />

      <motion.path
        d="M11.2 20h1.6"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />

      {/* rope */}
      <motion.path
        d="M7.2 14.8c2.2 1.8 7.4 1.8 9.6 0"
        variants={v.rope}
        initial="initial"
        animate={controls}
      />

      <motion.path
        d="M7.2 14.5c2.2 1.8 7.4 1.8 9.6 0"
        variants={v.rope2}
        initial="initial"
        animate={controls}
      />

      {/* right post */}
      <motion.path
        d="M23 20v-15"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx="18"
        cy="3"
        r="1"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M22 20h1.6"
        variants={v.posts}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Program(props: ProgramProps) { return <IconWrapper icon={IconComponent} {...props} />; }

export { animations, Program, Program as ProgramIcon, type ProgramProps, type ProgramProps as ProgramIconProps };