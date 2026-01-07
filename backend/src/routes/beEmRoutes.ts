import express, { RequestHandler } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { query } from '../lib/db'

const router = express.Router()

type BeEmBody = {
  title?: string
  year?: number
  author?: string
  description?: string
  mediaId?: string | null
}

const mapBeEm = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  year: row.year,
  author: row.author,
  description: row.description,
  mediaId: row.media_id,
  url: row.url || null,
  thumbnailUrl: row.thumbnail_url || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

// GET all BE-EM items
const getAllBeEm: RequestHandler = async (_req, res): Promise<void> => {
  try {
    const items = await query(
      `SELECT b.*, m.url, m.thumbnail_url
       FROM be_em b
       LEFT JOIN media m ON m.id = b.media_id
       ORDER BY b.created_at DESC`
    )
    res.json(items.rows.map(r => mapBeEm(r)))
  } catch (error) {
    console.error('Error fetching BE-EM items:', error)
    res.status(500).json({ error: 'Failed to fetch BE-EM items' })
  }
}

// GET BE-EM item by ID
const getBeEmById: RequestHandler = async (req, res): Promise<void> => {
  try {
    const item = await query(
      `SELECT b.*, m.url, m.thumbnail_url
       FROM be_em b
       LEFT JOIN media m ON m.id = b.media_id
       WHERE b.id = $1
       LIMIT 1`,
      [req.params.id]
    )
    const row = item.rows[0]
    if (!row) {
      res.status(404).json({ error: 'BE-EM item not found' })
      return
    }
    res.json(mapBeEm(row))
  } catch (error) {
    console.error('Error fetching BE-EM item:', error)
    res.status(500).json({ error: 'Failed to fetch BE-EM item' })
  }
}

// POST create BE-EM item (protected)
const createBeEm: RequestHandler = async (req, res): Promise<void> => {
  try {
    const body = req.body as BeEmBody
    const result = await query(
      `INSERT INTO be_em (title, year, author, description, media_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        body.title,
        body.year || null,
        body.author || null,
        body.description || '',
        body.mediaId || null
      ]
    )
    res.status(201).json(mapBeEm(result.rows[0]))
  } catch (error) {
    console.error('Error creating BE-EM item:', error)
    res.status(500).json({ error: 'Failed to create BE-EM item' })
  }
}

// PUT update BE-EM item (protected)
const updateBeEm: RequestHandler = async (req, res): Promise<void> => {
  try {
    const body = req.body as BeEmBody
    const existing = await query('SELECT * FROM be_em WHERE id = $1 LIMIT 1', [req.params.id])
    if (!existing.rows[0]) {
      res.status(404).json({ error: 'BE-EM item not found' })
      return
    }

    const result = await query(
      `UPDATE be_em
       SET title = COALESCE($1, title),
           year = COALESCE($2, year),
           author = COALESCE($3, author),
           description = COALESCE($4, description),
           media_id = $5,
           updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [
        body.title || null,
        body.year || null,
        body.author || null,
        body.description || null,
        body.mediaId === undefined ? existing.rows[0].media_id : body.mediaId || null,
        req.params.id
      ]
    )

    res.json(mapBeEm(result.rows[0]))
  } catch (error) {
    console.error('Error updating BE-EM item:', error)
    res.status(500).json({ error: 'Failed to update BE-EM item' })
  }
}

// DELETE BE-EM item (protected)
const deleteBeEm: RequestHandler = async (req, res): Promise<void> => {
  try {
    const item = await query('DELETE FROM be_em WHERE id = $1 RETURNING id', [req.params.id])
    if (!item.rows[0]) {
      res.status(404).json({ error: 'BE-EM item not found' })
      return
    }
    res.json({ message: 'BE-EM item deleted successfully' })
  } catch (error) {
    console.error('Error deleting BE-EM item:', error)
    res.status(500).json({ error: 'Failed to delete BE-EM item' })
  }
}

// Routes
router.get('/', getAllBeEm)
router.get('/:id', getBeEmById)
router.post('/', authMiddleware, createBeEm)
router.put('/:id', authMiddleware, updateBeEm)
router.delete('/:id', authMiddleware, deleteBeEm)

export default router 
