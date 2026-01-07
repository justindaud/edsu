import express, { RequestHandler } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { query } from '../lib/db'

const router = express.Router()

type MediaBody = {
  title?: string
  type?: 'image' | 'video'
  url?: string
  thumbnailUrl?: string
  artist?: string | null
  year?: string | null
  description?: string
  placeholders?: string[]
  isHero?: boolean
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
  isHero: row.is_hero,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

// PATCH set hero media (protected)
const setHeroMedia: RequestHandler = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
    await query('UPDATE media SET is_hero = false')
    if (ids.length) {
      await query('UPDATE media SET is_hero = true WHERE id = ANY($1::uuid[])', [ids])
    }
    res.json({ success: true, ids })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating hero media' })
  }
}

// GET all media
const getMedia: RequestHandler = async (_req, res) => {
  try {
    const result = await query(
      `SELECT m.*, a.name AS artist_name 
       FROM media m 
       LEFT JOIN artists a ON m.artist_id = a.id
       ORDER BY m.created_at DESC`
    )
    res.json(result.rows.map(mapMedia))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching media' })
  }
}

// GET media by ID
const getMediaById: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, a.name AS artist_name 
       FROM media m 
       LEFT JOIN artists a ON m.artist_id = a.id
       WHERE m.id = $1
       LIMIT 1`,
      [req.params.id]
    )
    const row = result.rows[0]
    if (!row) {
      res.status(404).json({ success: false, message: 'Media not found' })
      return
    }
    res.json(mapMedia(row))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching media' })
  }
}

// POST create media
const createMedia: RequestHandler = async (req, res) => {
  try {
    const body = req.body as MediaBody
    if (!body.url || !body.thumbnailUrl) {
      res.status(400).json({ success: false, message: 'url and thumbnailUrl are required' })
      return
    }

    const result = await query(
      `INSERT INTO media (title, type, url, thumbnail_url, artist_id, year, description, placeholders, is_hero)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        body.title || '',
        body.type || 'image',
        body.url,
        body.thumbnailUrl,
        body.artist || null,
        body.year || null,
        body.description || '',
        Array.isArray(body.placeholders) ? body.placeholders : [],
        body.isHero ?? false
      ]
    )

    const row = result.rows[0]
    if (body.isHero) {
      await query('UPDATE media SET is_hero = false WHERE id <> $1', [row.id])
    }
    res.status(201).json({ success: true, data: mapMedia(row) })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating media' })
  }
}

// PATCH update media
const updateMedia: RequestHandler = async (req, res) => {
  try {
    const body = req.body as MediaBody
    const existing = await query('SELECT * FROM media WHERE id = $1 LIMIT 1', [req.params.id])
    if (!existing.rows[0]) {
      res.status(404).json({ success: false, message: 'Media not found' })
      return
    }

    const result = await query(
      `UPDATE media
       SET title = COALESCE($1, title),
           type = COALESCE($2, type),
           url = COALESCE($3, url),
           thumbnail_url = COALESCE($4, thumbnail_url),
           artist_id = $5,
           year = COALESCE($6, year),
           description = COALESCE($7, description),
           placeholders = COALESCE($8, placeholders),
           is_hero = COALESCE($9, is_hero),
           updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [
        body.title || null,
        body.type || null,
        body.url || null,
        body.thumbnailUrl || null,
        body.artist === undefined ? existing.rows[0].artist_id : body.artist || null,
        body.year || null,
        body.description || null,
        Array.isArray(body.placeholders) ? body.placeholders : null,
        body.isHero === undefined ? null : body.isHero,
        req.params.id
      ]
    )

    if (body.isHero) {
      await query('UPDATE media SET is_hero = false WHERE id <> $1', [req.params.id])
    }
    res.json({ success: true, data: mapMedia(result.rows[0]) })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating media' })
  }
}

// DELETE media
const deleteMedia: RequestHandler = async (req, res) => {
  try {
    const deleted = await query('DELETE FROM media WHERE id = $1 RETURNING id', [req.params.id])
    if (!deleted.rows[0]) {
      res.status(404).json({ success: false, message: 'Media not found' })
      return
    }
    res.json({ success: true, message: 'Media deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting media' })
  }
}

// Routes
router.get('/', getMedia as RequestHandler)
router.patch('/hero', authMiddleware, setHeroMedia as RequestHandler)
router.get('/:id', getMediaById as RequestHandler)
router.post('/', authMiddleware, createMedia as RequestHandler)
router.patch('/:id', authMiddleware, updateMedia as RequestHandler)
router.delete('/:id', authMiddleware, deleteMedia as RequestHandler)

export default router 
