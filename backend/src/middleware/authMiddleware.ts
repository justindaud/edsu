import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    role: string
    organization: string
  }
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' })
      return
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - Invalid token format' })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret')
    req.user = decoded as AuthRequest['user']
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Unauthorized - Invalid token' })
  }
} 