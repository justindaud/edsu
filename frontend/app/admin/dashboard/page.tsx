'use client'

import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { ImageCropper } from '@/components/ui/image-cropper'
import {
  fetchPrograms,
  fetchMedia,
  fetchArticles,
  fetchBeEm,
  createProgram,
  updateProgram,
  deleteProgram,
  createMedia,
  updateMedia,
  deleteMedia,
  updateHeroMedia,
  createArticle,
  updateArticle,
  deleteArticle,
  createArtist,
  updateArtist,
  deleteArtist,
  createBeEm,
  updateBeEm,
  deleteBeEm,
  fetchArtists,
} from '@/lib/services'
import api from '@/lib/api'
import type { Program, Media, Article, Artist, BeEm } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit, Save, LogOut, MoreHorizontal } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Dropzone } from '@/components/ui/dropzone'
import { DatePicker } from '@/components/ui/date-picker'
import { Search } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { getMediaType, imgproxy } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'

type Entity =
  | 'programs'
  | 'media'
  | 'articles'
  | 'artists'
  | 'be_em'

type Row =
  | Program
  | Media
  | Article
  | Artist
  | BeEm

type MediaOption = Pick<Media, '_id' | 'title' | 'url' | 'thumbnailUrl'>
type ArticleOption = Pick<Article, '_id' | 'title' | 'coverImage'>
type ProgramOption = Pick<Program, '_id' | 'title'>
type ArtistOption = Pick<Artist, '_id' | 'name' | 'photo'>

const entityLabels: Record<Entity, string> = {
  programs: 'Programs',
  media: 'Media',
  articles: 'Articles',
  artists: 'Artists',
  be_em: 'TBYT',
}

const fieldPresets: Record<Entity, { key: string; label: string; placeholder?: string }[]> = {
  programs: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'media', label: 'Media' },
    { key: 'artworks', label: 'Artworks' },
    { key: 'articles', label: 'Articles' },
  ],
  media: [
    { key: 'title', label: 'Title' },
    { key: 'year', label: 'Year' },
    { key: 'url', label: 'URL' },
    { key: 'thumbnailUrl', label: 'Thumbnail URL' },
    { key: 'description', label: 'Description' },
  ],
  articles: [
    { key: 'title', label: 'Title' },
    { key: 'content', label: 'Content' },
    { key: 'coverImage', label: 'Cover Image URL' },
    { key: 'program', label: 'Program' },
    { key: 'media', label: 'Media' },
  ],
  artists: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'photo', label: 'Photo Media' },
    { key: 'artworks', label: 'Artworks' },
  ],
  be_em: [
    { key: 'title', label: 'Title' },
    { key: 'year', label: 'Year' },
    { key: 'author', label: 'Author' },
    { key: 'description', label: 'Description' },
    { key: 'mediaId', label: 'Media ID' },
  ],
}

const normalizePayload = (entity: Entity, form: Record<string, any>): any => {
  const clean = { ...form }
  const toArray = (val?: string) =>
    val && val.trim() ? val.split(',').map((v) => v.trim()).filter(Boolean) : []

  switch (entity) {
    case 'programs':
      return {
        title: clean.title,
        description: clean.description,
        startDate: clean.startDate,
        endDate: clean.endDate,
        media: toArray(clean.media),
        artworks: toArray(clean.artworks),
        articles: toArray(clean.articles),
      }
    case 'media': {
      const isHero =
        clean.isHero === true ||
        clean.isHero === 'true' ||
        clean.isHero === 1 ||
        clean.isHero === '1'
      return {
        title: clean.title,
        type: clean.type || undefined,
        url: clean.url,
        thumbnailUrl: clean.thumbnailUrl || clean.url,
        artist: clean.artistId || clean.artist || null,
        year: clean.year || undefined,
        description: clean.description,
        isHero,
      }
    }
    case 'articles':
      const plain = (clean.content || '').replace(/<[^>]+>/g, ' ')
      const snippet = plain.split(/\s+/).filter(Boolean).slice(0, 40).join(' ')
      return {
        title: clean.title,
        content: clean.content,
        excerpt: clean.excerpt || snippet,
        coverImage: clean.coverImage,
        program: clean.program || null,
        media: toArray(clean.media),
      }
    case 'artists':
      return {
        name: clean.name,
        description: clean.description,
        photo: clean.photo || null,
        artworks: toArray(clean.artworks),
      }
    case 'be_em':
      return {
        title: clean.title,
        year: clean.year ? Number(clean.year) : null,
        author: clean.author || null,
        description: clean.description || '',
        mediaId: clean.mediaId || null,
      }
    default:
      return clean
  }
}

const listFetcher: Record<Entity, () => Promise<Row[]>> = {
  programs: fetchPrograms as any,
  media: fetchMedia as any,
  articles: fetchArticles as any,
  artists: fetchArtists as any,
  be_em: fetchBeEm as any,
}

const createMap: Record<Entity, (p: any) => Promise<Row>> = {
  programs: createProgram as any,
  media: createMedia as any,
  articles: createArticle as any,
  artists: createArtist as any,
  be_em: createBeEm as any,
}

const updateMap: Record<Entity, (id: string, p: any) => Promise<Row>> = {
  programs: updateProgram as any,
  media: updateMedia as any,
  articles: updateArticle as any,
  artists: updateArtist as any,
  be_em: updateBeEm as any,
}

const deleteMap: Record<Entity, (id: string) => Promise<void>> = {
  programs: deleteProgram,
  media: deleteMedia,
  articles: deleteArticle,
  artists: deleteArtist,
  be_em: deleteBeEm,
}

export default function AdminDashboard() {
  const router = useRouter()
  const gridRef = useRef<HTMLDivElement | null>(null)
  const entityKeys: Entity[] = ['programs', 'media', 'articles', 'artists', 'be_em']
  const [entity, setEntity] = useState<Entity>(() => {
    if (typeof window === 'undefined') return 'programs'
    const saved = window.localStorage.getItem('dashboard-entity') as Entity | null
    return saved && entityKeys.includes(saved) ? saved : 'programs'
  })
  const [rows, setRows] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [allMedia, setAllMedia] = useState<MediaOption[]>([])
  const [allArticles, setAllArticles] = useState<ArticleOption[]>([])
  const [allPrograms, setAllPrograms] = useState<ProgramOption[]>([])
  const [allArtists, setAllArtists] = useState<ArtistOption[]>([])
  const [selectedPreviewType, setSelectedPreviewType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [heroMode, setHeroMode] = useState(false)
  const [heroSelection, setHeroSelection] = useState<string[]>([])
  const [heroSaving, setHeroSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewItemRef = useRef<{
    src: string
    type?: string
    title?: string
  } | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [gridMetrics, setGridMetrics] = useState({
    columns: 2,
    rowHeight: 360,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const fields = useMemo(() => fieldPresets[entity], [entity])
  const [hasToken, setHasToken] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setHasToken(false)
      toast.error('Session expired. Please re-login.')
      router.replace('/admin')
    }
  }, [router])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!gridRef.current) return
    const element = gridRef.current
    const updateMetrics = () => {
      const width = element.clientWidth || 0
      const cols =
        width >= 1024 ? 5 :
        width >= 640 ? 3 :
        2
      const gap = 16
      const itemWidth = (width - gap * (cols - 1)) / cols
      const mediaHeight = itemWidth * 0.75
      const textHeight = 96
      setGridMetrics({
        columns: cols,
        rowHeight: Math.max(260, Math.round(mediaHeight + textHeight)),
      })
    }
    updateMetrics()
    const observer = new ResizeObserver(updateMetrics)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listFetcher[entity]()
      setRows(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setForm({})
    setEditingId(null)
    setOpen(false)
    setSelectedFile(null)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dashboard-entity', entity)
    }
    load()
  }, [entity])

  useEffect(() => {
    if (entity !== 'media') {
      setHeroMode(false)
      setHeroSelection([])
      return
    }
    const selected = rows
      .filter((r: any) => r.isHero)
      .map((r: any) => String(r._id || r.id))
    setHeroSelection(selected)
  }, [entity, rows])

  useEffect(() => {
    const prime = async () => {
      try {
        const [m, a, p, ar] = await Promise.all([fetchMedia(), fetchArticles(), fetchPrograms(), fetchArtists()])
        setAllMedia(m || [])
        setAllArticles(a || [])
        setAllPrograms(p || [])
        setAllArtists(ar || [])
      } catch (e) {
        // ignore preload errors
      }
    }
    prime()
  }, [])

  const handleEdit = (row: any) => {
    setEditingId(row._id || row.id)
    setSelectedFile(null)
    if (selectedPreview) {
      URL.revokeObjectURL(selectedPreview)
      setSelectedPreview(null)
    }
    const urlFromRow = row.thumbnailUrl || row.url || ''
    if (urlFromRow) {
      const lower = urlFromRow.toLowerCase()
      const typeGuess = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')
        ? 'video'
        : lower.endsWith('.pdf')
          ? 'pdf'
          : 'image'
      setSelectedPreview(urlFromRow)
      setSelectedPreviewType(typeGuess as any)
    } else {
      setSelectedPreviewType(null)
    }
    setCropSrc(null)
    const preset = fieldPresets[entity]
    const next: Record<string, any> = {}
    preset.forEach(({ key }) => {
      const val = (row as any)[key]
      if (Array.isArray(val)) {
        // handle array of ids or objects
        const ids = val.map((v) => (typeof v === 'string' ? v : v?._id || v?.id || '')).filter(Boolean)
        next[key] = ids.join(', ')
      } else if (val === null || val === undefined) {
        next[key] = ''
      } else if (key.toLowerCase().includes('date')) {
        try {
          const d = new Date(val)
          next[key] = isNaN(d.getTime()) ? String(val) : d.toISOString().slice(0, 10)
        } catch {
          next[key] = String(val)
        }
      } else {
        next[key] = String(val)
      }
    })
    if (entity === 'programs') {
      const start = (row as any).startDate || (row as any).start_date
      const end = (row as any).endDate || (row as any).end_date
      if (start) {
        const d = new Date(start)
        next.startDate = isNaN(d.getTime()) ? String(start) : d.toISOString().slice(0, 10)
      }
      if (end) {
        const d = new Date(end)
        next.endDate = isNaN(d.getTime()) ? String(end) : d.toISOString().slice(0, 10)
      }
    }
    if (entity === 'media') {
      next.artistId =
        (row as any)?.artist?._id ||
        (row as any)?.artist?.id ||
        (row as any)?.artist_id ||
        next.artistId ||
        ''
      const existing = (row as any)?.thumbnailUrl || (row as any)?.url
      if (existing) {
        setSelectedPreview(existing)
        // tebak tipe dari field type atau dari ekstensi url
        let type = (row as any)?.type || ''
        if (!type) {
          const lower = String(existing).toLowerCase()
          if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) type = 'video'
          else if (lower.endsWith('.pdf')) type = 'pdf'
          else type = 'image'
        }
        setSelectedPreviewType(type as any)
        next.url = existing
        next.thumbnailUrl = (row as any)?.thumbnailUrl || existing
        next.type = String(type || '')
      }
      next.isHero = Boolean((row as any)?.isHero)
    }
    setForm(next)
  }

  const handleDelete = async (id?: string) => {
    if (!id) return
    try {
      await deleteMap[entity](id)
      toast.success('Deleted')
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // simple required checks per entity
      const missing: string[] = []
      if (entity === 'programs') {
        if (!form.title) missing.push('Title')
        if (!form.startDate) missing.push('Start Date')
        if (!form.endDate) missing.push('End Date')
      } else if (entity === 'media') {
        if (!form.title) missing.push('Title')
        const resolvedUrl = form.url
        if (!resolvedUrl && !selectedFile) missing.push('Reselect File Please')
      } else if (entity === 'articles') {
        if (!form.title) missing.push('Title')
      } else if (entity === 'artists') {
        if (!form.name) missing.push('Name')
      } else if (entity === 'be_em') {
        if (!form.title) missing.push('Title')
      }
      if (missing.length) {
        const msg = `${missing.join(', ')} is required`
        setError(msg)
        toast.error(msg)
        setLoading(false)
        return
      }

      const payload = normalizePayload(entity, form)
      let uploadedMediaRes: any = null
      // Upload file right before saving if needed (media only)
      if (entity === 'media' && !editingId && !payload.url) {
        if (!selectedFile) throw new Error('Pilih file dulu untuk diupload')
        setUploading(true)
        setUploadProgress(0)
        try {
          const fd = new FormData()
          fd.append('file', selectedFile)
          fd.append('title', payload.title || selectedFile.name)
          const res = await api.post('/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (evt) => {
              if (evt.total) {
                const percent = Math.round((evt.loaded / evt.total) * 100)
                setUploadProgress(percent)
              }
            },
            timeout: 20000,
          })
          const { url, thumbnailUrl } = res.data || {}
          uploadedMediaRes = res.data || null
          payload.url = url
          payload.thumbnailUrl = thumbnailUrl || url
          payload.title = payload.title || selectedFile.name
          if (selectedFile.type?.startsWith('video')) payload.type = 'video'
          else if (selectedFile.type === 'application/pdf') payload.type = 'pdf'
          else payload.type = 'image'
          setUploadedUrl(url || null)
        } finally {
          setUploading(false)
          setUploadProgress(null)
          setSelectedFile(null)
        }
      }
      if (entity === 'media') {
        payload.thumbnailUrl = payload.thumbnailUrl || payload.url
      }
      const idToUse = editingId || (form as any)._id || (form as any).id
      if (editingId && !idToUse) throw new Error('ID tidak valid')
      if (editingId) {
        await updateMap[entity](idToUse as string, payload)
        toast.success('Updated')
      } else {
        // If media was already created via /upload, skip createMap to avoid duplicate
        if (entity === 'media' && uploadedMediaRes) {
          const createdId =
            uploadedMediaRes?._id ||
            uploadedMediaRes?.id ||
            uploadedMediaRes?.media?._id ||
            uploadedMediaRes?.media?.id
          
          if (createdId) {
            await updateMap.media(createdId as string, payload)
          } else {
            await createMap.media(payload)
          }

          toast.success('Created')
        } else {
          await createMap[entity](payload)
          toast.success('Created')
        }
      }
      setForm({})
      setEditingId(null)
      setOpen(false)
      await load()
    } catch (e: any) {
      let msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Save failed'
      if (e?.response?.status === 401) {
        msg = 'Session expired. Please re-login.'
        toast.error("Session expired. Please re-login.", {
          action: {
            label: "Go to login page",
            onClick: () => router.push("/admin"),
          },
        })
        setError(msg)
        setLoading(false)
        return
      }
      if (String(msg).toLowerCase().includes('file too large') || String(msg).includes('LIMIT_FILE_SIZE')) {
        msg = 'File terlalu besar (max 50MB). Silakan pilih file lebih kecil.'
      }
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (entity !== 'media') return
    setUploadError(null)
    setSelectedFile(file)
    setUploadedUrl(null)
    if (selectedPreview) URL.revokeObjectURL(selectedPreview)
    const url = URL.createObjectURL(file)
    setSelectedPreview(url)
    if (file.type.startsWith('image')) {
      setCropSrc(url)
    }
    const type = file.type || ''
    if (type.startsWith('video')) {
      setSelectedPreviewType('video')
    } else if (type === 'application/pdf') {
      setSelectedPreviewType('pdf')
    } else {
      setSelectedPreviewType('image')
    }
    setForm((f) => ({
      ...f,
      title: f.title || file.name,
    }))
  }

  const filteredRows = useMemo(() => {
    const q = query.toLowerCase().trim()
    const base = !q
      ? rows
      : rows.filter((row: any) => {
      const fields = [
        row.title,
        row.name,
        row.description,
        row.content,
      ]
      return fields.some((f) => (f || '').toLowerCase().includes(q))
    })
    if (entity === 'media' && heroMode) {
      return [...base].sort((a: any, b: any) => Number(Boolean(b.isHero)) - Number(Boolean(a.isHero)))
    }
    return base
  }, [rows, query, entity, heroMode])

  const virtualizedRows = useMemo(() => {
    if (!gridRef.current) {
      return { startPad: 0, endPad: 0, items: filteredRows }
    }
    const elementTop = gridRef.current.getBoundingClientRect().top + (window.scrollY || 0)
    const viewportHeight = window.innerHeight || 0
    const rowHeight = gridMetrics.rowHeight
    const columns = gridMetrics.columns
    const totalRows = Math.ceil(filteredRows.length / columns)
    const scrollTop = Math.max(0, scrollY - elementTop)
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2)
    const endRow = Math.min(totalRows - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) + 2)
    const startIndex = startRow * columns
    const endIndex = Math.min(filteredRows.length - 1, (endRow + 1) * columns - 1)
    const startPad = startRow * rowHeight
    const endPad = Math.max(0, (totalRows - endRow - 1) * rowHeight)
    return {
      startPad,
      endPad,
      items: filteredRows.slice(startIndex, endIndex + 1),
    }
  }, [filteredRows, gridMetrics.columns, gridMetrics.rowHeight, scrollY])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.replace('/admin')
  }

  const toggleHeroSelection = (id: string) => {
    setHeroSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSaveHero = async () => {
    if (entity !== 'media') return
    setHeroSaving(true)
    try {
      await updateHeroMedia(heroSelection)
      toast.success('Hero media updated')
      await load()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update hero media')
    } finally {
      setHeroSaving(false)
    }
  }

  const openPreview = useCallback((src?: string, type?: string, title?: string) => {
    if (!src) return
    previewItemRef.current = { src, type, title }
    setPreviewOpen(true)
  }, [])

  const handleEditOpen = useCallback(
    (row: any) => {
      handleEdit(row)
      setOpen(true)
    },
    [handleEdit]
  )

  const handleDeleteRow = useCallback(
    (id?: string) => {
      if (!id) return
      handleDelete(id)
    },
    [handleDelete]
  )

  if (!hasToken) return null

  return (
    <div className="min-h-screen bg-[var(--edsu-white)] text-foreground p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-2xl font-bold font-heading">Admin Panel</h1>
        <div className="flex items-center gap-2">
          
          {entity === 'media' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="hero-mode">Select Hero</Label>
                <Switch id="hero-mode" checked={heroMode} onCheckedChange={setHeroMode} />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-11 p-0"
                disabled={!heroMode || heroSaving}
                onClick={handleSaveHero}
                aria-label="Save hero media"
              >
                {heroSaving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          )}
          
          <Select value={entity} onValueChange={(val) => { setEntity(val as Entity); setQuery('') }}>
            <SelectTrigger className="h-11 border-2 border-border bg-card font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(entityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="" onSubmit={(e) => e.preventDefault()}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-48 pr-12 font-semibold"
              placeholder="Search..."
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-11 w-11 p-0"
                onClick={() => {
                  setEditingId(null)
                  setForm({})
                  if (selectedPreview) URL.revokeObjectURL(selectedPreview)
                  setSelectedPreview(null)
                  setSelectedPreviewType(null)
                  setSelectedFile(null)
                  setCropSrc(null)
                  setOpen(true)
                }}
                aria-label="New"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden pb-4">
              <DialogHeader className="pr-10">
                <DialogTitle className="text-xl">
                  {editingId ? 'Edit' : 'Create'} {entityLabels[entity]}
                </DialogTitle>
              </DialogHeader>
              <form
                id="entity-form"
                onSubmit={handleSubmit}
                className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
              >
                {/* Basic fields */}
                <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Title */}
                  {fields
                    .filter((f) => f.key === 'title')
                    .map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em]">
                          {field.label}
                        </label>
                        <Input
                          value={form[field.key] || ''}
                          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.placeholder || field.label}
                        />
                      </div>
                    ))}

                  {/*Artists Name */}
                  {fields
                      .filter((f) => f.key === 'name')
                      .map((field) => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-[0.12em]">
                            {field.label}
                          </label>
                          <Input
                            value={form[field.key] || ''}
                            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                            placeholder={field.placeholder || field.label}
                          />
                        </div>
                      ))}

                  <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Year */}
                  {fields
                    .filter((f) => f.key === 'year')
                    .map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em]">
                          {field.label}
                        </label>
                        <Input
                          value={form.year || ''}
                          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.placeholder || field.label}
                        />
                      </div>
                    ))}

                  {/* Author*/}
                  {fields
                    .filter((f) => f.key === 'author')
                    .map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em]">
                          {field.label}
                        </label>
                        <Input
                          value={form[field.key] || ''}
                          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder || field.label}
                      />
                    </div>
                  ))}
                  </div>

                  {/* Dates */}
                  <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields
                      .filter((f) => f.key.toLowerCase().includes('date'))
                      .map((field) => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-[0.12em]">
                            {field.label}
                          </label>
                          <DatePicker
                            value={form[field.key] || ''}
                            onChange={(val) => setForm((f) => ({ ...f, [field.key]: val }))}
                            className="max-w-[220px]"
                          />
                        </div>
                      ))}
                  </div>
                </div>

                {/* Attachments / relations */}
                <div className="space-y-3">
                  {entity === 'media' && (
                    <div className="space-y-2">
                      {cropSrc && selectedPreviewType === 'image' && selectedFile ? (
                          <ImageCropper
                            file={selectedFile}
                            onCropped={(file, previewUrl) => {
                              const url = previewUrl || URL.createObjectURL(file)
                              if (selectedPreview) URL.revokeObjectURL(selectedPreview)
                              setSelectedPreview(url)
                              setSelectedFile(file)
                              setSelectedPreviewType('image')
                              setCropSrc(null)
                            }}
                            onCancel={() => {
                              if (selectedPreview) URL.revokeObjectURL(selectedPreview)
                              setSelectedPreview(null)
                              setSelectedPreviewType(null)
                              setSelectedFile(null)
                              setCropSrc(null)
                              setForm((f) => ({ ...f, url: '', thumbnailUrl: '' }))
                            }}
                          />
                      ) : editingId ? (
                        <div className="space-y-2">
                          <div className="relative overflow-hidden min-h-[240px] bg-muted flex items-center justify-center">
                            {selectedPreview && selectedPreviewType === 'image' && (
                              <img
                                src={imgproxy(selectedPreview, { w: 400 })}
                                alt={form.title || 'Preview'}
                                className="absolute inset-0 h-full w-full object-contain bg-white"
                              />
                            )}
                            {selectedPreview && selectedPreviewType === 'video' && (
                              <video
                                src={selectedPreview}
                                className="absolute inset-0 h-full w-full object-contain bg-black"
                                muted
                                playsInline
                              />
                            )}
                            {selectedPreview && selectedPreviewType === 'pdf' && (
                              <iframe
                                src={selectedPreview}
                                className="absolute inset-0 h-full w-full bg-white"
                                title={form.title || 'Preview PDF'}
                              />
                            )}
                            {!selectedPreview && (
                              <span className="text-sm text-muted-foreground">Tidak ada preview</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            File tidak bisa diganti di mode edit. Hapus media lalu buat baru untuk replace.
                          </p>
                        </div>
                      ) : (
                        <Dropzone
                          onFileAccepted={handleFileSelect}
                          accept={{
                            'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                            'video/*': ['.mp4', '.mov', '.webm'],
                            'application/pdf': ['.pdf'],
                          }}
                          previewUrl={selectedPreview || undefined}
                          previewType={selectedPreviewType as any}
                          previewAlt={form.title || 'Preview'}
                          onClear={() => {
                            if (selectedPreview) URL.revokeObjectURL(selectedPreview)
                            setSelectedPreview(null)
                            setSelectedPreviewType(null)
                            setSelectedFile(null)
                            setCropSrc(null)
                            setForm((f) => ({ ...f, url: '', thumbnailUrl: '' }))
                          }}
                        />
                      )}
                      {uploading && (
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Spinner className="h-3 w-3" />
                          </p>
                          {uploadProgress !== null && <Progress value={uploadProgress} />}
                        </div>
                      )}
                      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                      {uploadedUrl && <p className="text-xs text-edsu-green">Uploaded: {uploadedUrl}</p>}
                    </div>
                  )}

                  {(entity === 'programs' || entity === 'articles' || entity === 'artists' || entity === 'be_em' || entity == 'media') && (
                    <Accordion type="multiple">
                      {entity === 'programs' && (
                        <>
                          <AccordionItem value="prog-media" className="bg-card">
                            <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                              Media
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <MediaMulti
                                options={allMedia}
                                selected={form.media}
                                onChange={(val) => setForm((f) => ({ ...f, media: val }))}
                              />
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="prog-articles" className=" bg-card">
                            <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                              Articles
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <ArticleMulti
                                options={allArticles}
                                selected={form.articles}
                                onChange={(val) => setForm((f) => ({ ...f, articles: val }))}
                              />
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="prog-artworks" className="bg-card">
                            <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                              Artworks
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <MediaMulti
                                options={allMedia}
                                selected={form.artworks}
                                onChange={(val) => setForm((f) => ({ ...f, artworks: val }))}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </>
                      )}

                      {entity === 'media' && (
                        <AccordionItem value="media-artist" className=" bg-card">
                          <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                            Artist
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <ArtistMulti
                              options={allArtists}
                              selected={form.artistId}
                              onChange={(val) => setForm((f) => ({ ...f, artistId: val }))}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {entity === 'articles' && (
                        <AccordionItem value="article-media" className="bg-card">
                          <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                            Media
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <MediaMulti
                              options={allMedia}
                              selected={form.media}
                              onChange={(val) => setForm((f) => ({ ...f, media: val }))}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {entity === 'artists' && (
                        <>
                          <AccordionItem value="artist-photo" className="bg-card">
                            <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                              Photo
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <MediaSingle
                                options={allMedia}
                                selected={form.photo}
                                onChange={(val) => setForm((f) => ({ ...f, photo: val }))}
                              />
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="artist-artworks" className="bg-card">
                            <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                              Artworks
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <MediaMulti
                                options={allMedia}
                                selected={form.artworks}
                                onChange={(val) => setForm((f) => ({ ...f, artworks: val }))}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </>
                      )}

                      {entity === 'be_em' && (
                      <AccordionItem value="beem-media" className="bg-card">
                        <AccordionTrigger className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em]">
                          Media
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                            <MediaSingle
                              options={allMedia}
                              selected={form.mediaId}
                              onChange={(val) => setForm((f) => ({ ...f, mediaId: val }))}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  )}
                </div>

                {/* Description / content placed after attachments for clarity */}
                {fields
                  .filter(
                    (f) =>
                      ['description', 'content'].includes(f.key)
                  )
                  .map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.12em]">
                        {field.label}
                      </label>
                        <Textarea
                          value={form[field.key] || ''}
                          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                          className="min-h-[320px]"
                        />
                    </div>
                  ))}

                {error && <p className="text-sm text-red-500">{error}</p>}
              </form>
              <div className="sticky bottom-0 flex justify-end gap-2 bg-card">
                {editingId && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-10 w-10 p-0"
                    onClick={async () => {
                      const id = editingId || (form as any)._id || (form as any).id
                      if (!id) return
                      try {
                        await deleteMap[entity](id)
                        toast.success('Deleted')
                        setForm({})
                        setEditingId(null)
                        setOpen(false)
                        await load()
                      } catch (e: any) {
                        toast.error(e?.message || 'Delete failed')
                      }
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  type="submit"
                  form="entity-form"
                  disabled={loading || uploading}
                  className="h-10 w-10 p-0"
                  aria-label={editingId ? 'Save' : 'Create'}
                >
                  {loading || uploading ? (
                    <Spinner className="h-5 w-5" />
                  ) : editingId ? (
                    <Save className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </Button>
              </div>
              </DialogContent>
            </Dialog>
          <Button
            variant="destructive"
            className="h-11 w-11 p-0"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div ref={gridRef} className="w-full">
        {loading &&
          Array.from({ length: 12 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="overflow-hidden bg-card border-border shadow-sm">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse" />
                <div className="h-3 w-1/2 bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        {!loading && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
            style={{
              paddingTop: virtualizedRows.startPad,
              paddingBottom: virtualizedRows.endPad,
            }}
          >
            {virtualizedRows.items.map((row: any) => {
              const rowId = String(row._id || row.id || '')
              return (
                <MediaCard
                  key={rowId}
                  row={row}
                  rowId={rowId}
                  entity={entity}
                  heroMode={heroMode}
                  heroSelected={heroSelection.includes(rowId)}
                  onToggleHero={toggleHeroSelection}
                  onPreview={openPreview}
                  onEdit={handleEditOpen}
                  onDelete={handleDeleteRow}
                />
              )
            })}
          </div>
        )}
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-base">{previewItemRef.current?.title || 'Preview'}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full max-h-[70vh] bg-[var(--edsu-white)]">
            {previewItemRef.current?.type === 'video' ? (
              <video
                src={previewItemRef.current.src}
                className="max-h-[70vh] w-full object-contain"
                controls
                playsInline
              />
            ) : previewItemRef.current?.type === 'pdf' ? (
              <iframe
                src={previewItemRef.current.src}
                className="h-[70vh] w-full bg-white"
                title={previewItemRef.current?.title || 'Preview'}
              />
            ) : (
              <img
                src={imgproxy(((previewItemRef.current)?.src || ''), { w: 200 })}
                alt={previewItemRef.current?.title || 'Preview'}
                className="max-h-[70vh] w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const parseIds = (val?: string) =>
  val && val.trim() ? val.split(',').map((v) => v.trim()).filter(Boolean) : []
const joinIds = (ids: string[]) => ids.join(', ')

function MediaChip({
  m,
  active,
  toggle,
}: {
  m: MediaOption
  active: boolean
  toggle: () => void
}) {
  const img = m.thumbnailUrl || m.url || ''
  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative overflow-hidden border-2 transition ${
        active
          ? 'border-emerald-500 ring-2 ring-emerald-400 ring-offset-1'
          : 'border-border'
      }`}
    >
      <div className="aspect-square bg-muted">
        <img src={imgproxy(img, {w:400})} alt={m.title || ''} className="h-full w-full object-cover decoding='async'" />
      </div>
      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
        {m.title || ''}
      </div>
      {active && (
        <span className="absolute left-1.5 top-1.5 px-2 py-[2px] text-[10px] font-semibold uppercase text-white">
          Selected
        </span>
      )}
    </button>
  )
}

const MediaCard = memo(function MediaCard({
  row,
  rowId,
  entity,
  heroMode,
  heroSelected,
  onToggleHero,
  onPreview,
  onEdit,
  onDelete,
}: {
  row: any
  rowId: string
  entity: Entity
  heroMode: boolean
  heroSelected: boolean
  onToggleHero: (id: string) => void
  onPreview: (src?: string, type?: string, title?: string) => void
  onEdit: (row: any) => void
  onDelete: (id?: string) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const img =
    row.thumbnailUrl ||
    row.url ||
    row.coverImage ||
    row.photo?.thumbnailUrl ||
    row.photo?.url ||
    (row.media && row.media[0]?.thumbnailUrl) ||
    (row.media && row.media[0]?.url) ||
    (row.artworks && row.artworks[0]?.thumbnailUrl) ||
    (row.artworks && row.artworks[0]?.url)
  const previewSrc = row.url || img || ''
  const previewType =
    row.type ||
    (previewSrc && previewSrc.toLowerCase().endsWith('.pdf')
      ? 'pdf'
      : getMediaType(previewSrc))
  const title = row.title || row.name || row.description || '-'
  const metaRaw = row.description || row.content || '-'
  let meta = metaRaw
  try {
    const d = new Date(metaRaw)
    if (!isNaN(d.getTime())) meta = d.toLocaleDateString('id-ID')
  } catch {}

  return (
    <div className="group overflow-hidden bg-card border-border shadow-sm transition-all duration-300 text-card-foreground hover:shadow-xl hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {entity === 'media' && row.isHero && (
          <span className="absolute left-2 top-2 z-10 bg-[var(--edsu-pink)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            Hero
          </span>
        )}
        {entity === 'media' && heroMode && rowId && (
          <label className="absolute right-2 top-2 z-10 flex items-center gap-2 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--edsu-black)]">
            <input
              type="checkbox"
              checked={heroSelected}
              onChange={() => onToggleHero(rowId)}
              className="h-3 w-3"
            />
            Hero
          </label>
        )}
        <button
          type="button"
          className="absolute inset-0 z-[1]"
          onClick={() => {
            setShowActions(false)
            onPreview(previewSrc, previewType, title)
          }}
          aria-label={`Preview ${title}`}
        />
        {row.type === 'video' ? (
          <video
            src={row.url || img}
            poster={img}
            className="h-full w-full object-cover"
            loop
            playsInline
            autoPlay
            muted
            preload="metadata"
          />
        ) : row.type === 'pdf' ? (
          <iframe src={row.url || img} className="h-full w-full bg-white" title={title} />
        ) : (
          <img
            src={imgproxy(img, { w: 400 })}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        )}
        <button
          type="button"
          className="absolute right-2 top-2 z-10 bg-white/80 p-1"
          onClick={(event) => {
            event.stopPropagation()
            setShowActions((prev) => !prev)
          }}
          aria-label="Toggle actions"
        >
          <MoreHorizontal className="h-4 w-4 text-[var(--edsu-black)]" />
        </button>
        {showActions && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-black/30">
            <Button
              size="sm"
              variant="outline"
              className="h-10 w-10 p-0 bg-white text-[var(--edsu-black)]"
              onClick={(event) => {
                event.stopPropagation()
                onEdit(row)
              }}
              aria-label="Edit"
            >
              <Edit />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-10 w-10 p-0"
              onClick={(event) => {
                event.stopPropagation()
                onDelete(row._id || row.id)
              }}
              aria-label="Delete"
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <div className="text-sm font-semibold leading-tight line-clamp-2">{title}</div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground line-clamp-2">
          {meta}
        </div>
      </div>
    </div>
  )
})

function MediaMulti({
  options,
  selected,
  onChange,
}: {
  options: MediaOption[]
  selected?: string
  onChange: (val: string) => void
}) {
  const [query, setQuery] = useState('')
  const picked = parseIds(selected)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? options.filter((m) => (m.title || '').toLowerCase().includes(q)) : options
  }, [options, query])
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aSel = picked.includes(a._id) ? -1 : 1
      const bSel = picked.includes(b._id) ? -1 : 1
      if (aSel !== bSel) return aSel - bSel
      return (a.title || '').localeCompare(b.title || '')
    })
  }, [filtered, picked])
  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
    onChange(joinIds(next))
  }
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 pr-10"
          placeholder="Search"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-full"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {picked.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Selected: {picked.length}</span>
          <button
            type="button"
            className="underline text-foreground/70"
            onClick={() => onChange('')}
          >
            Clear selection
          </button>
        </div>
      )}
      <div className="grid grid-cols-5 gap-3 max-h-96 overflow-auto bg-card">
        {sorted.map((m) => (
          <MediaChip key={m._id} m={m} active={picked.includes(m._id)} toggle={() => toggle(m._id)} />
        ))}
      </div>
    </div>
  )
}

function MediaSingle({
  options,
  selected,
  onChange,
}: {
  options: MediaOption[]
  selected?: string
  onChange: (val: string) => void
}) {
  const [query, setQuery] = useState('')
  const value = selected || ''
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? options.filter((m) => (m.title || '').toLowerCase().includes(q)) : options
  }, [options, query])
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aSel = value === a._id ? -1 : 1
      const bSel = value === b._id ? -1 : 1
      if (aSel !== bSel) return aSel - bSel
      return (a.title || '').localeCompare(b.title || '')
    })
  }, [filtered, value])
  return (
    <div className="space-y-2">
      <div className="relative" role="search">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 pr-10"
          placeholder="Search"
        />
        <Button type="button" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {value && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Dipilih: 1</span>
          <button
            type="button"
            className="underline text-foreground/70"
            onClick={() => onChange('')}
          >
            Hapus
          </button>
        </div>
      )}
      <div className="grid grid-cols-5 gap-3 max-h-96 overflow-auto bg-card">
        {sorted.map((m) => (
          <MediaChip key={m._id} m={m} active={value === m._id} toggle={() => onChange(m._id)} />
        ))}
      </div>
    </div>
  )
}

function ArticleMulti({
  options,
  selected,
  onChange,
}: {
  options: ArticleOption[]
  selected?: string
  onChange: (val: string) => void
}) {
  const [query, setQuery] = useState('')
  const picked = parseIds(selected)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? options.filter((a) => (a.title || '').toLowerCase().includes(q)) : options
  }, [options, query])
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aSel = picked.includes(a._id) ? -1 : 1
      const bSel = picked.includes(b._id) ? -1 : 1
      if (aSel !== bSel) return aSel - bSel
      return (a.title || '').localeCompare(b.title || '')
    })
  }, [filtered, picked])
  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
    onChange(joinIds(next))
  }
  return (
    <div className="space-y-2">
      <div className="relative" role="search">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 pr-10"
          placeholder="Search"
        />
        <Button type="button" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {picked.length > 0 && (
        <div className="text-xs text-muted-foreground">Selected: {picked.length}</div>
      )}
      <div className="grid grid-cols-5 gap-3 max-h-96 overflow-auto bg-card">
        {sorted.map((a) => {
          const active = picked.includes(a._id)
          return (
            <button
              key={a._id}
              type="button"
              onClick={() => toggle(a._id)}
              className={`relative overflow-hidden transition ${
                active ? 'border-emerald-500 ring-2 ring-emerald-400 ring-offset-1' : 'border-border'
              }`}
            >
              <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                {a.coverImage ? (
                  <img src={imgproxy(a.coverImage, { w: 400 })} alt={a.title || ''} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <span className="px-2 text-xs text-muted-foreground text-center">{a.title || ''}</span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                {a.title || ''}
              </div>
              {active && (
                <span className="absolute left-1.5 top-1.5 px-2 py-[2px] text-[10px] font-semibold uppercase text-white">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgramSingle({
  options,
  selected,
  onChange,
}: {
  options: ProgramOption[]
  selected?: string
  onChange: (val: string) => void
}) {
  return (
    <Select value={selected || ''} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Pilih program" />
      </SelectTrigger>
      <SelectContent>
        {options.map((p) => (
          <SelectItem key={p._id} value={p._id}>
            {p.title || ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ArtistMulti({
  options,
  selected,
  onChange,
}: {
  options: ArtistOption[]
  selected?: string
  onChange: (val: string) => void
}) {
  const [query, setQuery] = useState('')
  const picked = parseIds(selected)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? options.filter((a) => (a.name || '').toLowerCase().includes(q)) : options
  }, [options, query])
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aSel = picked.includes(a._id) ? -1 : 1
      const bSel = picked.includes(b._id) ? -1 : 1
      if (aSel !== bSel) return aSel - bSel
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [filtered, picked])
  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
    onChange(joinIds(next))
  }
  return (
    <div className="space-y-2">
      <div className="relative" role="search">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 pr-10"
          placeholder="Search"
        />
        <Button type="button" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {picked.length > 0 && (
        <div className="text-xs text-muted-foreground">Selected: {picked.length}</div>
      )}
      <div className="grid grid-cols-5 gap-3 max-h-96 overflow-auto bg-card">
        {sorted.map((a) => {
          const active = picked.includes(a._id)
          const img = a.photo?.thumbnailUrl || a.photo?.url || ''
          return (
            <button
              key={a._id}
              type="button"
              onClick={() => toggle(a._id)}
              className={`relative overflow-hidden transition ${
                active ? 'border-emerald-500 ring-2 ring-emerald-400 ring-offset-1' : 'border-border'
              }`}
            >
              <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                <img src={imgproxy(img, {w:400})} alt={a.name || ''} className="h-full w-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                {a.name || ''}
              </div>
              {active && (
                <span className="absolute left-1.5 top-1.5 py-[2px] text-[10px] font-semibold uppercase text-white">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
