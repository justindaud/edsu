import { Router, RequestHandler, NextFunction, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware'
import { query } from '../lib/db'

const router = Router()

interface ArticleBody {
  title: string
  content: string
  excerpt?: string
  coverMediaId?: string
  coverImage?: string
  media?: string[]
  isPublished?: boolean
  program?: string
}

type AuthRequestHandler<P = {}, ResBody = any, ReqBody = any> = 
  (req: AuthRequest & { params: P } & { body: ReqBody }, res: Response<ResBody>, next: NextFunction) => Promise<void>

const slugify = (text: string) =>
  text.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const mapMediaRow = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  type: row.type,
  url: row.url,
  thumbnailUrl: row.thumbnail_url,
  artist: row.artist_id ? { _id: row.artist_id } : null,
  year: row.year,
  description: row.description,
  placeholders: row.placeholders || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const attachMediaToArticles = (articles: any[], mediaRows: any[]) => {
  const mediaByArticle: Record<string, any[]> = {}
  for (const row of mediaRows) {
    if (!mediaByArticle[row.article_id]) mediaByArticle[row.article_id] = []
    mediaByArticle[row.article_id].push(mapMediaRow(row))
  }
  return articles.map(article => ({
    ...article,
    media: mediaByArticle[article._id] || []
  }))
}

// GET all articles
const getAllArticles: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const articlesResult = await query(
      `
        SELECT 
          a.id,
          a.title,
          a.slug,
          a.content,
          a.excerpt,
          a.cover_media_id,
          a.cover_image_url,
          a.program_id,
          a.created_at,
          a.updated_at,
          u.username AS author_username,
          m.url   AS cover_url,
          m.thumbnail_url AS cover_thumb
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN media m ON a.cover_media_id = m.id
        ORDER BY a.created_at DESC
      `
    )

    const baseArticles = articlesResult.rows.map(row => ({
      _id: row.id,
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      coverImage: row.cover_thumb || row.cover_url || row.cover_image_url,
      coverMediaId: row.cover_media_id,
      author: row.author_username ? { username: row.author_username } : null,
      isPublished: true,
      publishedAt: null,
      program: row.program_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    if (baseArticles.length === 0) {
      res.json([])
      return
    }

    const ids = baseArticles.map(a => a._id)
    const mediaResult = await query(
      `
        SELECT am.article_id, m.*
        FROM articles_media am
        JOIN media m ON am.media_id = m.id
        WHERE am.article_id = ANY($1::uuid[])
      `,
      [ids]
    )

    res.json(attachMediaToArticles(baseArticles, mediaResult.rows))
  } catch (error) {
    next(error)
  }
}

// GET article by ID
const getArticleById: RequestHandler<{ id: string }> = async (req, res, next): Promise<void> => {
  try {
    const articleResult = await query(
      `
        SELECT 
          a.id,
          a.title,
          a.slug,
          a.content,
          a.excerpt,
          a.cover_media_id,
          a.cover_image_url,
          a.program_id,
          a.created_at,
          a.updated_at,
          u.username AS author_username,
          m.url   AS cover_url,
          m.thumbnail_url AS cover_thumb
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN media m ON a.cover_media_id = m.id
        WHERE a.id = $1
        LIMIT 1
      `,
      [req.params.id]
    )

    const row = articleResult.rows[0]
    if (!row) {
      res.status(404).json({ error: 'Article not found' })
      return
    }

    const mediaResult = await query(
      `
        SELECT am.article_id, m.*
        FROM articles_media am
        JOIN media m ON am.media_id = m.id
        WHERE am.article_id = $1
      `,
      [row.id]
    )

    const article = {
      _id: row.id,
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      coverImage: row.cover_thumb || row.cover_url || row.cover_image_url,
      coverMediaId: row.cover_media_id,
      author: row.author_username ? { username: row.author_username } : null,
      isPublished: true,
      publishedAt: null,
      program: row.program_id,
      media: mediaResult.rows.map(mapMediaRow),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    res.json(article)
  } catch (error) {
    next(error)
  }
}

const insertArticleMedia = async (articleId: string, mediaIds: string[] = []) => {
  if (!mediaIds.length) return
  const values = mediaIds.map((id, idx) => `($1, $${idx + 2})`).join(', ')
  await query(
    `INSERT INTO articles_media (article_id, media_id) VALUES ${values} ON CONFLICT DO NOTHING`,
    [articleId, ...mediaIds]
  )
}

const ensureSlug = async (title: string, existingId?: string) => {
  const base = slugify(title)
  const existing = await query(
    `SELECT slug FROM articles WHERE slug LIKE $1 ${existingId ? 'AND id <> $2' : ''}`,
    existingId ? [`${base}%`, existingId] : [`${base}%`]
  )
  if (!existing.rows.find(r => r.slug === base)) return base
  let counter = 2
  while (true) {
    const candidate = `${base}-${counter}`
    if (!existing.rows.find(r => r.slug === candidate)) return candidate
    counter += 1
  }
}

// POST create article (protected)
const createArticle: AuthRequestHandler<{}, any, ArticleBody> = async (req, res, next): Promise<void> => {
  try {
    const { title, content, excerpt, coverMediaId, coverImage, media = [], program } = req.body
    const authorId = req.user?.id

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' })
      return
    }

    const slug = await ensureSlug(title)
    const insertResult = await query(
      `
        INSERT INTO articles (title, slug, content, excerpt, cover_media_id, cover_image_url, author_id, program_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        title,
        slug,
        content,
        excerpt || null,
        coverMediaId || null,
        coverImage || null,
        authorId || null,
        program || null
      ]
    )

    const article = insertResult.rows[0]
    await insertArticleMedia(article.id, media)

    const mediaResult = await query(
      'SELECT am.article_id, m.* FROM articles_media am JOIN media m ON am.media_id = m.id WHERE am.article_id = $1',
      [article.id]
    )

    res.status(201).json({
      _id: article.id,
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.cover_image_url,
      coverMediaId: article.cover_media_id,
      author: authorId ? { id: authorId } : null,
      isPublished: true,
      publishedAt: null,
      program: article.program_id,
      media: mediaResult.rows.map(mapMediaRow),
      createdAt: article.created_at,
      updatedAt: article.updated_at
    })
  } catch (error) {
    next(error)
  }
}

// PUT update article (protected)
const updateArticle: AuthRequestHandler<{ id: string }, any, Partial<ArticleBody>> = async (req, res, next): Promise<void> => {
  try {
    const { title, content, excerpt, coverMediaId, coverImage, media, program } = req.body

    const existing = await query('SELECT * FROM articles WHERE id = $1 LIMIT 1', [req.params.id])
    const article = existing.rows[0]
    if (!article) {
      res.status(404).json({ error: 'Article not found' })
      return
    }

    const slug = title ? await ensureSlug(title, req.params.id) : article.slug
    const updated = await query(
      `
        UPDATE articles
        SET 
          title = COALESCE($1, title),
          slug = $2,
          content = COALESCE($3, content),
          excerpt = COALESCE($4, excerpt),
          cover_media_id = COALESCE($5, cover_media_id),
          cover_image_url = COALESCE($6, cover_image_url),
          program_id = COALESCE($7, program_id),
          updated_at = now()
        WHERE id = $8
        RETURNING *
      `,
      [
        title || null,
        slug,
        content || null,
        excerpt || null,
        coverMediaId || null,
        coverImage || null,
        program || null,
        req.params.id
      ]
    )

    if (media) {
      await query('DELETE FROM articles_media WHERE article_id = $1', [req.params.id])
      await insertArticleMedia(req.params.id, media)
    }

    const mediaResult = await query(
      'SELECT am.article_id, m.* FROM articles_media am JOIN media m ON am.media_id = m.id WHERE am.article_id = $1',
      [req.params.id]
    )

    const updatedArticle = updated.rows[0]

    res.json({
      _id: updatedArticle.id,
      id: updatedArticle.id,
      title: updatedArticle.title,
      slug: updatedArticle.slug,
      content: updatedArticle.content,
      excerpt: updatedArticle.excerpt,
      coverImage: updatedArticle.cover_image_url,
      coverMediaId: updatedArticle.cover_media_id,
      author: updatedArticle.author_id ? { id: updatedArticle.author_id } : null,
      isPublished: true,
      publishedAt: null,
      program: updatedArticle.program_id,
      media: mediaResult.rows.map(mapMediaRow),
      createdAt: updatedArticle.created_at,
      updatedAt: updatedArticle.updated_at
    })
  } catch (error) {
    next(error)
  }
}

// DELETE article (protected)
const deleteArticle: AuthRequestHandler<{ id: string }> = async (req, res, next): Promise<void> => {
  try {
    const article = await query('DELETE FROM articles WHERE id = $1 RETURNING id', [req.params.id])
    if (!article.rows[0]) {
      res.status(404).json({ error: 'Article not found' })
      return
    }
    res.json({ message: 'Article deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// Routes
router.get('/', getAllArticles)
router.get('/:id', getArticleById)
router.post('/', authMiddleware, createArticle as RequestHandler)
router.put('/:id', authMiddleware, updateArticle as RequestHandler)
router.delete('/:id', authMiddleware, deleteArticle as RequestHandler)

export default router 
