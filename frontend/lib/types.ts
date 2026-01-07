export type ID = string

export interface Media {
  _id: ID
  id?: ID
  title?: string
  type?: string
  mediaType?: 'image' | 'video' | 'unknown'
  isVideo?: boolean
  url: string
  thumbnailUrl?: string
  artistId?: ID
  artist?: { _id: ID; name?: string } | null
  year?: string | null
  description?: string
  placeholders?: string[]
  isHero?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Article {
  _id: ID
  id?: ID
  title: string
  content?: string
  excerpt?: string
  coverImage?: string
  author?: { username?: string } | null
  isPublished?: boolean
  publishedAt?: string
  media?: Media[]
  createdAt?: string
  updatedAt?: string
}

export interface Program {
  _id: ID
  id?: ID
  title: string
  description?: string
  startDate?: string
  endDate?: string
  media?: Media[]
  artworks?: Media[]
  articles?: Article[]
  createdAt?: string
  updatedAt?: string
}

export interface Artist {
  _id: ID
  name: string
  description?: string
  photo?: Media | null
  artworks?: Media[]
  createdAt?: string
  updatedAt?: string
}

export interface AuthUser {
  id: ID
  username: string
  role?: string
  organization?: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface BeEm {
  _id: ID
  id?: ID
  title: string
  year?: number | null
  author?: string | null
  description?: string
  mediaId?: ID | null
  url?: string | null
  thumbnailUrl?: string | null
  createdAt?: string
  updatedAt?: string
}
