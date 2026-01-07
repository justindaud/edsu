import express, { RequestHandler } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { query } from '../lib/db'

const router = express.Router()

type ArtistBody = {
  name?: string
  description?: string
  photo?: string | null
}

const mapMedia = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  type: row.type,
  url: row.url,
  thumbnailUrl: row.thumbnail_url,
  artist: row.artist_id ? { _id: row.artist_id, name: row.artist_name || undefined } : null,
  year: row.year,
  description: row.description,
  placeholders: row.placeholders || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapArtist = (row: any, photo?: any, artworks: any[] = []) => ({
  _id: row.id,
  id: row.id,
  name: row.name,
  description: row.description,
  photo: photo ? { _id: photo.id, url: photo.url, thumbnailUrl: photo.thumbnail_url, title: photo.title } : null,
  artworks,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const loadArtworks = async (artistIds: string[]) => {
  if (!artistIds.length) return {}
  const res = await query(
    `SELECT m.*, a.name AS artist_name 
     FROM media m 
     LEFT JOIN artists a ON m.artist_id = a.id
     WHERE m.artist_id = ANY($1::uuid[])
     ORDER BY m.created_at DESC`,
    [artistIds]
  )
  const byArtist: Record<string, any[]> = {}
  for (const row of res.rows) {
    if (!byArtist[row.artist_id]) byArtist[row.artist_id] = []
    byArtist[row.artist_id].push(mapMedia(row))
  }
  return byArtist
}

// GET all artists
const getAllArtists: RequestHandler = async (_req, res) => {
  try {
    const artistsRes = await query(
      `SELECT a.*, p.url AS photo_url, p.thumbnail_url AS photo_thumbnail, p.title AS photo_title
       FROM artists a
       LEFT JOIN media p ON a.photo_media_id = p.id
       ORDER BY a.name ASC`
    )

    const artistIds = artistsRes.rows.map(r => r.id)
    const artworksByArtist = await loadArtworks(artistIds)

    const artists = artistsRes.rows.map(row =>
      mapArtist(row, row.photo_media_id ? { id: row.photo_media_id, url: row.photo_url, thumbnail_url: row.photo_thumbnail, title: row.photo_title } : null, artworksByArtist[row.id] || [])
    )

    res.json(artists)
  } catch (error) {
    console.error('Error fetching artists:', error)
    res.status(500).json({ error: 'Failed to fetch artists' })
  }
}

// GET artist by ID
const getArtistById: RequestHandler = async (req, res) => {
  try {
    const artistRes = await query(
      `SELECT a.*, p.url AS photo_url, p.thumbnail_url AS photo_thumbnail, p.title AS photo_title
       FROM artists a
       LEFT JOIN media p ON a.photo_media_id = p.id
       WHERE a.id = $1
       LIMIT 1`,
      [req.params.id]
    )
    const row = artistRes.rows[0]
    if (!row) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }
    const artworksByArtist = await loadArtworks([row.id])
    res.json(
      mapArtist(row, row.photo_media_id ? { id: row.photo_media_id, url: row.photo_url, thumbnail_url: row.photo_thumbnail, title: row.photo_title } : null, artworksByArtist[row.id] || [])
    )
  } catch (error) {
    console.error('Error fetching artist:', error)
    res.status(500).json({ error: 'Failed to fetch artist' })
  }
}

// POST create artist
const createArtist: RequestHandler = async (req, res) => {
  try {
    const { name, description, photo } = req.body as ArtistBody

    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }

    const dup = await query('SELECT 1 FROM artists WHERE name = $1 LIMIT 1', [name])
    if (dup.rowCount && dup.rowCount > 0) {
      res.status(400).json({ error: 'Artist with this name already exists' })
      return
    }

    const result = await query(
      `INSERT INTO artists (name, description, photo_media_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || '', photo || null]
    )
    const row = result.rows[0]
    res.status(201).json(mapArtist(row, undefined, []))
  } catch (error) {
    console.error('Error creating artist:', error)
    res.status(500).json({ error: 'Failed to create artist' })
  }
}

// PATCH update artist
const updateArtist: RequestHandler = async (req, res) => {
  try {
    const { name, description, photo } = req.body as ArtistBody

    const existing = await query('SELECT * FROM artists WHERE id = $1 LIMIT 1', [req.params.id])
    if (!existing.rows[0]) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }

    if (name) {
      const dup = await query('SELECT 1 FROM artists WHERE name = $1 AND id <> $2 LIMIT 1', [name, req.params.id])
      if (dup.rowCount && dup.rowCount > 0) {
        res.status(400).json({ error: 'Artist with this name already exists' })
        return
      }
    }

    const result = await query(
      `UPDATE artists
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           photo_media_id = $3,
           updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [
        name || null,
        description || null,
        photo === undefined ? existing.rows[0].photo_media_id : photo || null,
        req.params.id
      ]
    )

    const row = result.rows[0]
    const photoMediaId = row.photo_media_id
    let photoData
    if (photoMediaId) {
      const photoRes = await query('SELECT id, url, thumbnail_url, title FROM media WHERE id = $1 LIMIT 1', [photoMediaId])
      photoData = photoRes.rows[0]
    }
    res.json(mapArtist(row, photoData, []))
  } catch (error) {
    console.error('Error updating artist:', error)
    res.status(500).json({ error: 'Failed to update artist' })
  }
}

// DELETE artist
const deleteArtist: RequestHandler = async (req, res) => {
  try {
    const count = await query('SELECT COUNT(*)::int AS c FROM media WHERE artist_id = $1', [req.params.id])
    if (count.rows[0].c > 0) {
      res.status(400).json({ 
        error: 'Cannot delete artist with existing artworks. Please reassign or delete artworks first.' 
      })
      return
    }

    const deleted = await query('DELETE FROM artists WHERE id = $1 RETURNING id', [req.params.id])
    if (!deleted.rows[0]) {
      res.status(404).json({ error: 'Artist not found' })
      return
    }

    res.json({ message: 'Artist deleted successfully' })
  } catch (error) {
    console.error('Error deleting artist:', error)
    res.status(500).json({ error: 'Failed to delete artist' })
  }
}

// Public routes
router.get('/', getAllArtists as RequestHandler)
router.get('/:id', getArtistById as RequestHandler)

// Protected routes (admin only)
router.post('/', authMiddleware, createArtist as RequestHandler)
router.patch('/:id', authMiddleware, updateArtist as RequestHandler)
router.delete('/:id', authMiddleware, deleteArtist as RequestHandler)

export default router
