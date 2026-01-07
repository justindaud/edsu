import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/authMiddleware'
import { query } from '../lib/db'
import { uploadBufferToMinio, getPresignedPutUrl } from '../lib/minio'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Allow bigger files for video/pdf; adjust as needed
    fileSize: 100 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'application/pdf',
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images (jpg/png/gif/webp), mp4/mov, or pdf are allowed.'))
    }
  }
})

interface UploadResponse {
  url: string
  thumbnailUrl: string
  type: string
  title: string
  description: string
}

// POST upload image (protected)
const uploadMediaFile = async (
  req: Request & { file?: Express.Multer.File },
  res: Response<UploadResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' } as any)
      return
    }

    const uploadResult = await uploadBufferToMinio({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      prefix: 'media',
      filename: req.file.originalname
    })

    const imageUrl = uploadResult.url
    // For non-images, fallback thumbnail = same URL (no frame extraction here)
    const isVideo = req.file.mimetype.startsWith('video/')
    const isPdf = req.file.mimetype === 'application/pdf'
    const thumbnailUrl = uploadResult.thumbnailUrl || uploadResult.url

    const result = await query(
      `INSERT INTO media (url, thumbnail_url, type, title, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        imageUrl,
        thumbnailUrl,
        isVideo ? 'video' : isPdf ? 'pdf' : 'image',
        req.body.title || req.file.originalname,
        req.body.description || ''
      ]
    )

    const row = result.rows[0]

    res.status(201).json({
      _id: row.id,
      id: row.id,
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      type: row.type,
      title: row.title,
      description: row.description
    } as any)
    return
  } catch (error) {
    next(error)
    return
  }
}

// Routes
router.post(
  '/',
  authMiddleware,
  (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        // Handle Multer errors gracefully
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large. Max 50MB.' })
        }
        return res.status(400).json({ error: err.message || 'Upload failed' })
      }
      next()
    })
  },
  uploadMediaFile
)

// Get presigned PUT URL (direct-to-MinIO)
router.post('/presign', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { filename, contentType, prefix } = req.body || {}
  if (!filename) {
    res.status(400).json({ error: 'filename is required' })
    return
  }
  try {
    const timeoutMs = 8000
    const started = Date.now()
    const data = await Promise.race([
      getPresignedPutUrl({
        filename,
        contentType: contentType || 'application/octet-stream',
        prefix: prefix || 'media'
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Presign timeout')), timeoutMs))
    ]) as Awaited<ReturnType<typeof getPresignedPutUrl>>
    console.log('Presign ok in', Date.now() - started, 'ms')

    res.json({
      uploadUrl: data.uploadUrl,
      key: data.key,
      url: data.publicUrl,
      thumbnailUrl: data.thumbnailUrl
    })
    return
  } catch (e: any) {
    console.error('Presign error:', e)
    res.status(500).json({ error: e?.message || 'Failed to presign URL' })
    return
  }
})

export default router 
