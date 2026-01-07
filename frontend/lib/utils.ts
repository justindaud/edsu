import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaType(url?: string, type?: string): 'image' | 'video' | 'unknown' {
  const lowerType = (type || '').toLowerCase()
  if (lowerType.startsWith('video')) return 'video'
  if (lowerType.startsWith('image')) return 'image'

  const lowerUrl = (url || '').toLowerCase()
  if (/\.(mp4|mov|webm|m4v|ogv)(\?.*)?$/.test(lowerUrl)) return 'video'
  if (/\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/.test(lowerUrl)) return 'image'
  return 'unknown'
}
