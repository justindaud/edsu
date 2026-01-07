import express, { RequestHandler } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { query } from '../lib/db'

const router = express.Router()

type MediaBody = {
  url?: string
  thumbnailUrl?: string
  type?: 'image' | 'video'
  title?: string
  description?: string
}

const mapMedia = (row: any) => ({
  _id: row.id,
  id: row.id,
  url: row.url,
  thumbnailUrl: row.thumbnail_url,
  type: row.type,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

// GET all media-tbyt
const getAllMediaTBYT: RequestHandler = async (_req, res): Promise<void> => {
  try {
    const media = await query('SELECT * FROM media_tbyt ORDER BY created_at DESC')
    res.json(media.rows.map(mapMedia))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media TBYT' })
  }
}

// GET media-tbyt by ID
const getMediaTBYTById: RequestHandler<{ id: string }> = async (req, res): Promise<void> => {
  try {
    const media = await query('SELECT * FROM media_tbyt WHERE id = $1 LIMIT 1', [req.params.id])
    if (!media.rows[0]) {
      res.status(404).json({ error: 'Media TBYT not found' })
      return
    }
    res.json(mapMedia(media.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media TBYT' })
  }
}

// POST create media-tbyt (protected)
const createMediaTBYT: RequestHandler = async (req, res): Promise<void> => {
  try {
    const body = req.body as MediaBody
    const result = await query(
      `INSERT INTO media_tbyt (url, thumbnail_url, type, title, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [body.url, body.thumbnailUrl || body.url, body.type || 'image', body.title || null, body.description || null]
    )
    res.status(201).json(mapMedia(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Failed to create media TBYT' })
  }
}

// PUT update media-tbyt (protected)
const updateMediaTBYT: RequestHandler<{ id: string }> = async (req, res): Promise<void> => {
  try {
    const body = req.body as MediaBody
    const result = await query(
      `UPDATE media_tbyt
       SET url = COALESCE($1, url),
           thumbnail_url = COALESCE($2, thumbnail_url),
           type = COALESCE($3, type),
           title = COALESCE($4, title),
           description = COALESCE($5, description),
           updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [body.url || null, body.thumbnailUrl || null, body.type || null, body.title || null, body.description || null, req.params.id]
    )
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Media TBYT not found' })
      return
    }
    res.json(mapMedia(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Failed to update media TBYT' })
  }
}

// DELETE media-tbyt (protected)
const deleteMediaTBYT: RequestHandler<{ id: string }> = async (req, res): Promise<void> => {
  try {
    const result = await query('DELETE FROM media_tbyt WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Media TBYT not found' })
      return
    }
    res.json({ message: 'Media TBYT deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media TBYT' })
  }
}

// Routes
router.get('/', getAllMediaTBYT)
router.get('/:id', getMediaTBYTById)
router.post('/', authMiddleware, createMediaTBYT)
router.put('/:id', authMiddleware, updateMediaTBYT)
router.delete('/:id', authMiddleware, deleteMediaTBYT)

export default router 
