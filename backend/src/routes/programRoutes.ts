import express, { RequestHandler } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { query } from '../lib/db'

const router = express.Router()

type ProgramBody = {
  title: string
  description: string
  startDate: string
  endDate: string
  media?: string[]
  articles?: string[]
  artworks?: string[]
}

const mapMedia = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  type: row.type,
  url: row.url,
  thumbnailUrl: row.thumbnail_url,
  artist: row.artist_id ? { _id: row.artist_id } : null,
  year: row.year,
  description: row.description,
  isPublic: true,
  placeholders: row.placeholders || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapArticle = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  content: row.content,
  excerpt: row.excerpt,
  coverImage: row.cover_thumb || row.cover_url || row.cover_image_url,
  coverMediaId: row.cover_media_id,
  media: row.media || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const attachProgramData = async (programs: any[]) => {
  if (programs.length === 0) return []
  const ids = programs.map(p => p._id)

  const mediaRes = await query(
    `SELECT pm.program_id, m.* FROM program_media pm JOIN media m ON pm.media_id = m.id WHERE pm.program_id = ANY($1::uuid[])`,
    [ids]
  )
  const artworksRes = await query(
    `SELECT pa.program_id, m.* FROM program_artworks pa JOIN media m ON pa.media_id = m.id WHERE pa.program_id = ANY($1::uuid[])`,
    [ids]
  )
  const articlesRes = await query(
    `SELECT
       pa.program_id AS program_id,
       a.id,
       a.title,
       a.slug,
       a.content,
       a.excerpt,
       a.cover_media_id,
       a.cover_image_url,
       m.url AS cover_url,
       m.thumbnail_url AS cover_thumb,
       a.author_id,
       a.created_at,
       a.updated_at,
       u.username AS author_username
     FROM program_articles pa
     JOIN articles a ON pa.article_id = a.id
     LEFT JOIN media m ON a.cover_media_id = m.id
     LEFT JOIN users u ON a.author_id = u.id
     WHERE pa.program_id = ANY($1::uuid[])`,
    [ids]
  )
  const articleIds = articlesRes.rows.map(r => r.id)
  const articleMediaRes = articleIds.length
    ? await query(
      `SELECT am.article_id, m.* FROM articles_media am JOIN media m ON am.media_id = m.id WHERE am.article_id = ANY($1::uuid[])`,
      [articleIds]
    )
    : { rows: [] }

  const mediaByProgram: Record<string, any[]> = {}
  const artworksByProgram: Record<string, any[]> = {}
  const articlesByProgram: Record<string, any[]> = {}
  const mediaByArticle: Record<string, any[]> = {}

  for (const row of mediaRes.rows) {
    if (!mediaByProgram[row.program_id]) mediaByProgram[row.program_id] = []
    mediaByProgram[row.program_id].push(mapMedia(row))
  }
  for (const row of artworksRes.rows) {
    if (!artworksByProgram[row.program_id]) artworksByProgram[row.program_id] = []
    artworksByProgram[row.program_id].push(mapMedia(row))
  }
  for (const row of articleMediaRes.rows) {
    if (!mediaByArticle[row.article_id]) mediaByArticle[row.article_id] = []
    mediaByArticle[row.article_id].push(mapMedia(row))
  }
  for (const row of articlesRes.rows) {
    const art = mapArticle({ ...row, media: mediaByArticle[row.id] || [] })
    const programId = row.program_id
    if (!articlesByProgram[programId]) articlesByProgram[programId] = []
    articlesByProgram[programId].push(art)
  }

  return programs.map(p => ({
    ...p,
    media: mediaByProgram[p._id] || [],
    artworks: artworksByProgram[p._id] || [],
    articles: articlesByProgram[p._id] || []
  }))
}

// GET all programs
const getPrograms: RequestHandler = async (req, res): Promise<void> => {
  try {
    const programsRes = await query(
      `
        SELECT p.*
        FROM programs p
        ORDER BY p.start_date DESC
      `
    )

    const programs = programsRes.rows.map(row => {
      return {
        _id: row.id,
        id: row.id,
        title: row.title,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    })

    const enriched = await attachProgramData(programs)
    res.json(enriched)
  } catch (error) {
    console.error('Error fetching programs:', error)
    res.status(500).json({ error: 'Failed to fetch programs' })
  }
}

// GET program by ID
const getProgramById: RequestHandler = async (req, res): Promise<void> => {
  try {
    const programRes = await query(
      `
        SELECT p.*
        FROM programs p
        WHERE p.id = $1
        LIMIT 1
      `,
      [req.params.id]
    )

    const row = programRes.rows[0]
    if (!row) {
      res.status(404).json({ error: 'Program not found' })
      return
    }

    const program = {
      _id: row.id,
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    const [enriched] = await attachProgramData([program])
    res.json(enriched)
  } catch (error) {
    console.error('Error fetching program:', error)
    res.status(500).json({ error: 'Failed to fetch program' })
  }
}

// POST create program (protected)
const createProgram: RequestHandler = async (req, res): Promise<void> => {
  try {
    const data = req.body as ProgramBody

    // Validate dates
    if (new Date(data.endDate) < new Date(data.startDate)) {
      res.status(400).json({ error: 'End date cannot be before start date' })
      return
    }

    const insert = await query(
      `INSERT INTO programs (title, description, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        data.title,
        data.description,
        data.startDate || null,
        data.endDate || null
      ]
    )

    const program = insert.rows[0]
    const programId = program.id

    const linkArrays: Array<{ table: string, ids?: string[] }> = [
      { table: 'program_media', ids: data.media },
      { table: 'program_articles', ids: data.articles },
      { table: 'program_artworks', ids: data.artworks }
    ]

    for (const link of linkArrays) {
      if (link.ids && link.ids.length) {
        const values = link.ids.map((_, idx) => `($1, $${idx + 2})`).join(', ')
        await query(
          `INSERT INTO ${link.table} (program_id, ${link.table.includes('articles') ? 'article_id' : 'media_id'}) VALUES ${values} ON CONFLICT DO NOTHING`,
          [programId, ...link.ids]
        )
      }
    }

    const [enriched] = await attachProgramData([{
      _id: program.id,
      id: program.id,
      title: program.title,
      description: program.description,
      startDate: program.start_date,
      endDate: program.end_date,
      createdAt: program.created_at,
      updatedAt: program.updated_at
    }])

    res.status(201).json(enriched)
  } catch (error) {
    console.error('Error creating program:', error)
    res.status(500).json({ error: 'Failed to create program' })
  }
}

// PUT update program (protected)
const updateProgram: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body as ProgramBody

    // Validate dates
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      res.status(400).json({ error: 'End date cannot be before start date' })
      return
    }

    const existing = await query('SELECT * FROM programs WHERE id = $1 LIMIT 1', [id])
    const program = existing.rows[0]
    if (!program) {
      res.status(404).json({ error: 'Program not found' })
      return
    }

    const updated = await query(
      `UPDATE programs
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [
        data.title || null,
        data.description || null,
        data.startDate || null,
        data.endDate || null,
        id
      ]
    )

    // Replace joins if provided
    if (data.media) {
      await query('DELETE FROM program_media WHERE program_id = $1', [id])
      if (data.media.length) {
        const values = data.media.map((_, idx) => `($1, $${idx + 2})`).join(', ')
        await query(`INSERT INTO program_media (program_id, media_id) VALUES ${values}`, [id, ...data.media])
      }
    }
    if (data.articles) {
      await query('DELETE FROM program_articles WHERE program_id = $1', [id])
      if (data.articles.length) {
        const values = data.articles.map((_, idx) => `($1, $${idx + 2})`).join(', ')
        await query(`INSERT INTO program_articles (program_id, article_id) VALUES ${values}`, [id, ...data.articles])
      }
    }
    if (data.artworks) {
      await query('DELETE FROM program_artworks WHERE program_id = $1', [id])
      if (data.artworks.length) {
        const values = data.artworks.map((_, idx) => `($1, $${idx + 2})`).join(', ')
        await query(`INSERT INTO program_artworks (program_id, media_id) VALUES ${values}`, [id, ...data.artworks])
      }
    }

    const updatedProgram = updated.rows[0]
    const [enriched] = await attachProgramData([{
      _id: updatedProgram.id,
      id: updatedProgram.id,
      title: updatedProgram.title,
      description: updatedProgram.description,
      startDate: updatedProgram.start_date,
      endDate: updatedProgram.end_date,
      createdAt: updatedProgram.created_at,
      updatedAt: updatedProgram.updated_at
    }])

    res.json(enriched)
  } catch (error) {
    console.error('Error updating program:', error)
    res.status(500).json({ error: 'Failed to update program' })
  }
}

// DELETE program (protected)
const deleteProgram: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params
    const deleted = await query('DELETE FROM programs WHERE id = $1 RETURNING id', [id])

    if (!deleted.rows[0]) {
      res.status(404).json({ error: 'Program not found' })
      return
    }

    res.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Error deleting program:', error)
    res.status(500).json({ error: 'Failed to delete program' })
  }
}

// Public routes
router.get('/', getPrograms)
router.get('/:id', getProgramById)

// Protected routes
router.post('/', authMiddleware, createProgram)
router.put('/:id', authMiddleware, updateProgram)
router.delete('/:id', authMiddleware, deleteProgram)

export default router 
