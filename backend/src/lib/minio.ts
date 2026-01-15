import { Client } from 'minio'
import path from 'path'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const {
  MINIO_ENDPOINT = 'localhost',
  MINIO_PORT = '9000',
  MINIO_USE_SSL = 'false',
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET = 'edsu-media',
  MINIO_PUBLIC_URL,
  IMGPROXY_URL
} = process.env

if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
  throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be defined')
}

export const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: Number(MINIO_PORT),
  useSSL: MINIO_USE_SSL === 'true',
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY
})

export const ensureBucket = async () => {
  // Add a small timeout so we don't hang forever if MinIO is unreachable
  const timeoutMs = 3000
  const race = await Promise.race([
    minioClient.bucketExists(MINIO_BUCKET),
    new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('MinIO check timeout')), timeoutMs))
  ])
  if (!race) {
    await minioClient.makeBucket(MINIO_BUCKET)
  }
}

const publicBase = MINIO_PUBLIC_URL
const imgproxyBase = IMGPROXY_URL || ''

export const uploadBufferToMinio = async (opts: {
  buffer: Buffer
  contentType?: string
  prefix?: string
  filename?: string
}) => {
  await ensureBucket()
  const key = [
    opts.prefix || 'uploads',
    `${Date.now()}-${crypto.randomUUID()}-${opts.filename || 'file'}`
  ].join('/')

  await minioClient.putObject(
    MINIO_BUCKET,
    key,
    opts.buffer,
    {
      'Content-Type': opts.contentType || 'application/octet-stream'
    }
  )

  const url = `${publicBase}/${MINIO_BUCKET}/${key}`
  const thumbnailUrl = url
  return { key, url, thumbnailUrl }
}

export const getPresignedPutUrl = async (opts: {
  contentType?: string
  prefix?: string
  filename?: string
  expiresSeconds?: number
}) => {
  // Assume bucket already exists; avoid connectivity check for presign to prevent timeouts
  const key = [
    opts.prefix || 'uploads',
    `${Date.now()}-${crypto.randomUUID()}-${opts.filename || 'file'}`
  ].join('/')

  const uploadUrl = await minioClient.presignedPutObject(
    MINIO_BUCKET,
    key,
    opts.expiresSeconds || 300,
    // MinIO JS client expects reqParams or cb; pass headers via reqParams
    {
      'Content-Type': opts.contentType || 'application/octet-stream'
    } as any
  )

  const publicUrl = `${publicBase}/${MINIO_BUCKET}/${key}`
  const thumbnailUrl = imgproxyBase
    ? `${imgproxyBase}/insecure/plain/${encodeURIComponent(publicUrl)}`
    : publicUrl

  return { key, uploadUrl, publicUrl, thumbnailUrl }
}

export default minioClient
