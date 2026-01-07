import express, { RequestHandler } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/authMiddleware'
import { query } from '../lib/db'
import { uploadBufferToMinio } from '../lib/minio'

const router = express.Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'))
    }
  }
})

type UIMediaBody = {
  title?: string
  description?: string
  isPublic?: boolean | string
  locationIds?: string[] | string
  index?: number | string
}

const parseLocationIds = (val: any) => {
  if (val === undefined) return null
  if (Array.isArray(val)) return val
  try {
    return JSON.parse(val)
  } catch {
    return null
  }
}

const mapUIMedia = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  type: row.type,
  url: row.url,
  thumbnailUrl: row.thumbnail_url,
  description: row.description,
  isPublic: row.is_public,
  locationIds: row.location_ids || [],
  index: row.idx,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

// GET all UI media
const getAllMedia: RequestHandler = async (_req, res): Promise<void> => {
  try {
    const media = await query('SELECT * FROM ui_media ORDER BY created_at DESC')
    res.json(media.rows.map(mapUIMedia))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' })
  }
}

// GET UI media by ID
const getMediaById: RequestHandler<{ id: string }> = async (req, res): Promise<void> => {
  try {
    const media = await query('SELECT * FROM ui_media WHERE id = $1 LIMIT 1', [req.params.id])
    if (!media.rows[0]) {
      res.status(404).json({ error: 'Media not found' })
      return
    }
    res.json(mapUIMedia(media.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' })
  }
}

// GET UI media by location ID
const getMediaByLocation: RequestHandler<{ locationId: string }> = async (req, res): Promise<void> => {
  try {
    const { locationId } = req.params
    const index = parseInt((req.query.index as string) || '0', 10)

    const media = await query(
      `SELECT * FROM ui_media WHERE $1 = ANY(location_ids) AND idx = $2 AND is_public = true ORDER BY created_at DESC LIMIT 1`,
      [locationId, index]
    )

    if (!media.rows[0]) {
      res.status(404).json({ error: 'Media not found for this location' })
      return
    }

    res.json(mapUIMedia(media.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' })
  }
}

// POST create UI media (protected)
const createMedia: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const uploadResult = await uploadBufferToMinio({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      prefix: 'ui-media',
      filename: req.file.originalname
    })
    const imageUrl = uploadResult.url
    const thumbnailUrl = uploadResult.thumbnailUrl
    const body = req.body as UIMediaBody
    const locationIds = parseLocationIds(body.locationIds) || []
    const idx = body.index !== undefined ? parseInt(body.index as any, 10) : 0

    const media = await query(
      `INSERT INTO ui_media (url, thumbnail_url, type, title, description, is_public, location_ids, idx)
       VALUES ($1, $2, 'image', $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        imageUrl,
        thumbnailUrl,
        body.title || req.file.originalname,
        body.description || '',
        body.isPublic === true || body.isPublic === 'true',
        locationIds,
        isNaN(idx) ? 0 : idx
      ]
    )

    res.status(201).json(mapUIMedia(media.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Failed to create media' })
  }
}

// PUT update UI media (protected)
const updateMedia: RequestHandler<{ id: string }> = async (req, res): Promise<void> => {
  try {
    const body = req.body as UIMediaBody
    const locationIds = parseLocationIds(body.locationIds)
    const idx = body.index !== undefined ? parseInt(body.index as any, 10) : null

    const media = await query(
      `UPDATE ui_media
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           is_public = COALESCE($3, is_public),
           location_ids = COALESCE($4, location_ids),
           idx = COALESCE($5, idx),
           updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [
        body.title || null,
        body.description || null,
        typeof body.isPublic === 'boolean' ? body.isPublic : (body.isPublic === 'true' ? true : null),
        locationIds || null,
        idx !== null && !isNaN(idx) ? idx : null,
        req.params.id
      ]
    )

    if (!media.rows[0]) {
      res.status(404).json({ error: 'Media not found' })
      return
    }

    res.json(mapUIMedia(media.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Failed to update media' })
  }
}

// DELETE UI media (protected)
const deleteMedia: RequestHandler<{ id: string }> = async (req, res): Promise<void> => {
  try {
    const media = await query('DELETE FROM ui_media WHERE id = $1 RETURNING id', [req.params.id])
    if (!media.rows[0]) {
      res.status(404).json({ error: 'Media not found' })
      return
    }
    res.json({ message: 'Media deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media' })
  }
}

// Routes
router.get('/', getAllMedia)
router.get('/by-location/:locationId', getMediaByLocation)
router.get('/:id', getMediaById)
router.post('/', authMiddleware, upload.single('file'), createMedia)
router.put('/:id', authMiddleware, updateMedia)
router.delete('/:id', authMiddleware, deleteMedia)

export default router
