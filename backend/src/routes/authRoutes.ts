import express, { RequestHandler, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware'
import { ApiError } from '../utils/ApiError'
import { query } from '../lib/db'

const router = express.Router()

interface AuthResponse {
  user: {
    id: string
    username: string
    role: string
    organization: string
  }
  token: string
}

type AuthRequestHandler<P = {}, ResBody = any, ReqBody = any> = 
  (req: AuthRequest & { params: P } & { body: ReqBody }, res: Response<ResBody>, next: NextFunction) => Promise<void>

// POST /api/auth/login
const login: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { username, password } = req.body
    console.log('Login attempt for username:', username)

    // Find user and include password hash for comparison
    const userResult = await query(
      'SELECT id, username, password_hash, role, organization FROM users WHERE username = $1 LIMIT 1',
      [username]
    )
    const user = userResult.rows[0]

    if (!user) {
      console.log('User not found:', username)
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    console.log('User found:', {
      id: user.id,
      username: user.username,
      role: user.role,
      organization: user.organization
    })

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash)
    console.log('Password match:', isMatch)
    
    if (!isMatch) {
      console.log('Invalid password for user:', username)
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    // Create token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        organization: user.organization
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    )

    // Return user info without password
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      role: user.role,
      organization: user.organization
    }

    console.log('Login successful for user:', username, 'with token')
    res.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Failed to login' })
  }
}

// GET /api/auth/me
const getMe: AuthRequestHandler = async (req, res, next): Promise<void> => {
  try {
    const userResult = await query(
      'SELECT id, username, role, organization FROM users WHERE id = $1 LIMIT 1',
      [req.user?.id]
    )
    const user = userResult.rows[0]
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ error: 'Failed to get user info' })
  }
}

router.post('/authenticate', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      throw new ApiError(400, 'Missing credentials')
    }

    const userResult = await query(
      'SELECT id, username, password_hash, role, organization FROM users WHERE username = $1 LIMIT 1',
      [username]
    )
    const user = userResult.rows[0]

    if (!user) {
      throw new ApiError(401, 'Invalid credentials')
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash)
    
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Invalid credentials')
    }

    // If organization is missing, update with default
    if (!user.organization) {
      await query('UPDATE users SET organization = $1 WHERE id = $2', ['EDSU', user.id])
      user.organization = 'EDSU'
    }

    // Return user data without sensitive information
    const userData = {
      id: user.id.toString(),
      username: user.username,
      role: user.role,
      organization: user.organization || 'EDSU'
    }

    res.json(userData)
  } catch (error) {
    next(error)
  }
})

// Routes
router.post('/login', login)
router.get('/me', authMiddleware, getMe as RequestHandler)

export default router 
