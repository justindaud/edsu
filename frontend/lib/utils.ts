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

export function imgproxy(src: string, opts?: { w?: number; h?: number }) {
  if (!src) return ""
  
  const base = process.env.NEXT_PUBLIC_IMGPROXY_URL?.replace(/\/+$/, "")
  const media = process.env.NEXT_PUBLIC_MEDIA_URL
  const minio = process.env.NEXT_PUBLIC_MINIO_LOCAL_URL
  
  if (!base || !media || !minio) return src

  const w = opts?.w ?? 0
  const h = opts?.h ?? 0

  let finalSrc = src

  try {
    const srcUrl = new URL(src)
    const mediaUrl = new URL(media)

    if (srcUrl.host === mediaUrl.host) {
      const minioUrl = new URL(minio)
      srcUrl.protocol = minioUrl.protocol
      srcUrl.host = minioUrl.host
      finalSrc = srcUrl.toString()
    }
  } catch {
    return src
  }
  return `${base}/insecure/rs:fit:${w}:${h}/plain/${finalSrc}`
}
