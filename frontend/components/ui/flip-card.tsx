'use client';

import { Button } from '@/components/ui/button';
import { easeOut, motion } from 'motion/react';
import * as React from 'react';
import { Github, Linkedin, Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlipCardData {
  name: string;
  username: string;
  image: string;
  bio: string;
  stats: {
    following: number;
    followers: number;
    posts?: number;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

interface FlipCardProps {
  data?: FlipCardData;
  front?: React.ReactNode;
  back?: React.ReactNode;
  className?: string;
}

export function FlipCard({ data, front, back, className }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const hasCustom = Boolean(front || back);

  const isTouchDevice =
    typeof window !== 'undefined' && 'ontouchstart' in window;

  const handleClick = () => {
    if (isTouchDevice) setIsFlipped(!isFlipped);
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsFlipped(true);
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice) setIsFlipped(false);
  };

  const cardVariants = {
    front: { rotateY: 0, transition: { duration: 0.5, ease: easeOut } },
    back: { rotateY: 180, transition: { duration: 0.5, ease: easeOut } },
  };

  const renderFront = () => {
    if (front) return front;
    if (!data) return null;
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center text-center">
        <img
          src={data.image}
          alt={data.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-foreground">{data.name}</h2>
          <p className="text-sm text-muted-foreground">@{data.username}</p>
        </div>
      </div>
    );
  };

  const renderBack = () => {
    if (back) return back;
    if (!data) return null;
    return (
      <>
        <p className="text-center text-xs text-muted-foreground md:text-sm">
          {data.bio}
        </p>

        <div className="flex w-full items-center justify-between px-6">
          <div>
            <p className="text-base font-bold">{data.stats.following}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
          <div>
            <p className="text-base font-bold">{data.stats.followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          {data.stats.posts && (
            <div>
              <p className="text-base font-bold">{data.stats.posts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {data.socialLinks?.linkedin && (
            <a
              href={data.socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Linkedin size={20} />
            </a>
          )}
          {data.socialLinks?.github && (
            <a
              href={data.socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Github size={20} />
            </a>
          )}
          {data.socialLinks?.twitter && (
            <a
              href={data.socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Twitter size={20} />
            </a>
          )}
        </div>

        <Button>Follow</Button>
      </>
    );
  };

  return (
    <div
      className={cn(
        'relative min-h-[10vh] w-full cursor-pointer perspective-1000',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={cn(
          "backface-hidden",
          hasCustom ? "bg-transparent p-0" : "bg-gradient-to-br from-muted via-background to-muted px-4 py-6"
        )}
        animate={isFlipped ? 'back' : 'front'}
        variants={cardVariants}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {renderFront()}
      </motion.div>

      <motion.div
        className={cn(
          "absolute inset-0 backface-hidden",
          hasCustom ? "bg-transparent p-0" : "bg-gradient-to-tr from-muted via-background to-muted px-4 py-6"
        )}
        initial={{ rotateY: 180 }}
        animate={isFlipped ? 'front' : 'back'}
        variants={cardVariants}
        style={{ transformStyle: 'preserve-3d', rotateY: 180 }}
      >
        <div className="flex h-full w-full flex-col items-center justify-between gap-y-4">
          {renderBack()}
        </div>
      </motion.div>
    </div>
  );
}
