import api from '@/lib/api'
import type { Media, Article, Artist, Program, AuthResponse, BeEm } from '@/lib/types'
import { getMediaType } from '@/lib/utils'

const mapMedia = (item: Media): Media => {
  const mediaType = getMediaType(item.url, item.type)
  return { ...item, mediaType, isVideo: mediaType === 'video' }
}

const mapProgram = (item: Program): Program => ({
  ...item,
  media: item.media?.map(mapMedia),
  artworks: item.artworks?.map(mapMedia),
})

const mapArticle = (item: Article): Article => ({
  ...item,
  media: item.media?.map(mapMedia),
})

const mapArtist = (item: Artist): Artist => ({
  ...item,
  photo: item.photo ? mapMedia(item.photo) : item.photo,
  artworks: item.artworks?.map(mapMedia),
})

// Programs
export const fetchPrograms = async (): Promise<Program[]> => {
  const res = await api.get<Program[]>('/programs')
  return res.data.map(mapProgram)
}

export const fetchProgram = async (id: string): Promise<Program> => {
  const res = await api.get<Program>(`/programs/${id}`)
  return mapProgram(res.data)
}

export const createProgram = async (payload: Partial<Program>): Promise<Program> => {
  const res = await api.post<Program>('/programs', payload)
  return res.data
}

export const updateProgram = async (id: string, payload: Partial<Program>): Promise<Program> => {
  const res = await api.put<Program>(`/programs/${id}`, payload)
  return res.data
}

export const deleteProgram = async (id: string): Promise<void> => {
  await api.delete(`/programs/${id}`)
}

// Media
export const fetchMedia = async (): Promise<Media[]> => {
  const res = await api.get<Media[]>('/media')
  return res.data.map(mapMedia)
}

export const fetchMediaById = async (id: string): Promise<Media> => {
  const res = await api.get<Media>(`/media/${id}`)
  return mapMedia(res.data)
}

export const createMedia = async (payload: Partial<Media>): Promise<Media> => {
  const res = await api.post<Media>('/media', payload)
  return res.data
}

export const updateMedia = async (id: string, payload: Partial<Media>): Promise<Media> => {
  const res = await api.patch<Media>(`/media/${id}`, payload)
  return res.data
}

export const deleteMedia = async (id: string): Promise<void> => {
  await api.delete(`/media/${id}`)
}

export const updateHeroMedia = async (ids: string[]): Promise<{ success: boolean; ids: string[] }> => {
  const res = await api.patch<{ success: boolean; ids: string[] }>(`/media/hero`, { ids })
  return res.data
}

// Artworks (media filtered by artist_id not null)}
export const fetchArtworks = async (): Promise<Media[]> => {
  const res = await api.get<Media[]>('/media')
  return res.data
    .filter((m: any) => m.artist_id || m.artist?.id || m.artist?._id)
    .map(mapMedia)
}

export const fetchArtwork = async (id: string): Promise<Media> => {
  const res = await api.get<Media>(`/media/${id}`)
  return mapMedia(res.data)
}

// Artists
export const fetchArtists = async (): Promise<Artist[]> => {
  const res = await api.get<Artist[]>('/artists')
  return res.data.map(mapArtist)
}

export const fetchArtist = async (id: string): Promise<Artist> => {
  const res = await api.get<Artist>(`/artists/${id}`)
  return mapArtist(res.data)
}

export const createArtist = async (payload: Partial<Artist>): Promise<Artist> => {
  const res = await api.post<Artist>('/artists', payload)
  return res.data
}

export const updateArtist = async (id: string, payload: Partial<Artist>): Promise<Artist> => {
  const res = await api.patch<Artist>(`/artists/${id}`, payload)
  return res.data
}

export const deleteArtist = async (id: string): Promise<void> => {
  await api.delete(`/artists/${id}`)
}

// Articles
export const fetchArticles = async (): Promise<Article[]> => {
  const res = await api.get<Article[]>('/articles')
  return res.data.map(mapArticle)
}

export const fetchArticle = async (id: string): Promise<Article> => {
  const res = await api.get<Article>(`/articles/${id}`)
  return mapArticle(res.data)
}

export const createArticle = async (payload: Partial<Article>): Promise<Article> => {
  const res = await api.post<Article>('/articles', payload)
  return res.data
}

export const updateArticle = async (id: string, payload: Partial<Article>): Promise<Article> => {
  const res = await api.put<Article>(`/articles/${id}`, payload)
  return res.data
}

export const deleteArticle = async (id: string): Promise<void> => {
  await api.delete(`/articles/${id}`)
}

// BeEm (books)
export const fetchBeEm = async (): Promise<BeEm[]> => {
  const res = await api.get<BeEm[]>('/be-em')
  return res.data
}

export const fetchBeEmById = async (id: string): Promise<BeEm> => {
  const res = await api.get<BeEm>(`/be-em/${id}`)
  return res.data
}

export const createBeEm = async (payload: Partial<BeEm>): Promise<BeEm> => {
  const res = await api.post<BeEm>('/be-em', payload)
  return res.data
}

export const updateBeEm = async (id: string, payload: Partial<BeEm>): Promise<BeEm> => {
  const res = await api.put<BeEm>(`/be-em/${id}`, payload)
  return res.data
}

export const deleteBeEm = async (id: string): Promise<void> => {
  await api.delete(`/be-em/${id}`)
}

// Auth
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', { username, password })
  return res.data
}
