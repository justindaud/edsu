import sharp from 'sharp'

export interface ServerCompressionOptions {
  maxSizeMB?: number
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export const compressImageBuffer = async (
  buffer: Buffer,
  options: ServerCompressionOptions = {}
): Promise<Buffer> => {
  const {
    maxSizeMB = 20,
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg'
  } = options

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  // Jika buffer sudah di bawah batas, return buffer asli
  if (buffer.length <= maxSizeBytes) {
    return buffer
  }

  try {
    let sharpInstance = sharp(buffer)

    // Resize jika dimensi melebihi batas
    const metadata = await sharpInstance.metadata()
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }

    // Kompresi berdasarkan format
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality })
        break
      case 'png':
        sharpInstance = sharpInstance.png({ quality })
        break
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality })
        break
      default:
        sharpInstance = sharpInstance.jpeg({ quality })
    }

    const compressedBuffer = await sharpInstance.toBuffer()
    
    // Jika masih terlalu besar, coba kompresi lebih agresif
    if (compressedBuffer.length > maxSizeBytes && quality > 30) {
      return await compressImageBuffer(buffer, {
        ...options,
        quality: Math.max(30, quality - 20)
      })
    }

    return compressedBuffer
  } catch (error) {
    console.error('Image compression failed:', error)
    // Jika kompresi gagal, return buffer asli
    return buffer
  }
}

// Function untuk mengecek apakah buffer perlu dikompresi
export const needsCompression = (buffer: Buffer, maxSizeMB: number = 20): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return buffer.length > maxSizeBytes
}

// Function untuk mendapatkan ukuran buffer dalam format yang mudah dibaca
export const formatBufferSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
