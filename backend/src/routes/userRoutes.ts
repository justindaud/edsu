import express, { Request, Response, NextFunction, RequestHandler } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware'
import { query } from '../lib/db'

interface CreateUserBody {
  username: string
  password: string
  organization: 'EDSU' | 'TokoBuku'
  role?: 'admin' | 'editor'
}

interface UpdateUserBody extends Partial<CreateUserBody> {}

interface AuthResponse {
  user: {
    id: string
    username: string
    role: string
    organization: string
  }
  token: string
}

interface MessageResponse {
  message?: string
  error?: string
}

const router = express.Router()
const allowedRoles = ['admin', 'editor']
const allowedOrganizations = ['EDSU', 'TokoBuku']

type AuthRequestHandler<P = {}, ResBody = any, ReqBody = any> = 
  (req: AuthRequest & { params: P } & { body: ReqBody }, res: Response<ResBody>, next: NextFunction) => Promise<void>

const mapUser = (row: any) => ({
  id: row.id,
  username: row.username,
  role: row.role,
  organization: row.organization
})

// GET all users (protected, admin only)
const getAllUsers: AuthRequestHandler = async (req, res, next): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' })
      return
    }
    const users = await query('SELECT id, username, role, organization, created_at, updated_at FROM users ORDER BY created_at DESC')
    res.json(users.rows)
  } catch (error) {
    next(error)
  }
}

// GET user by ID (protected)
const getUserById: AuthRequestHandler<{ id: string }> = async (req, res, next): Promise<void> => {
  try {
    if (req.user?.role !== 'admin' && req.user?.id !== req.params.id) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    const user = await query(
      'SELECT id, username, role, organization, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
      [req.params.id]
    )
    if (!user.rows[0]) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user.rows[0])
  } catch (error) {
    next(error)
  }
}

// POST create user (protected, admin only)
const createUser: AuthRequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { username, password, role = 'editor', organization } = req.body as CreateUserBody

    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' })
      return
    }

    if (!allowedOrganizations.includes(organization)) {
      res.status(400).json({ error: 'Organization must be either "EDSU" or "TokoBuku"' })
      return
    }

    const existing = await query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [username])
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(400).json({ error: 'Username already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await query(
      'INSERT INTO users (username, password_hash, organization, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role, organization',
      [username, hashedPassword, organization, role]
    )

    res.status(201).json(mapUser(result.rows[0]))
  } catch (error) {
    next(error)
  }
}

// PUT update user (protected)
const updateUser: AuthRequestHandler<{ id: string }> = async (req, res, next): Promise<void> => {
  try {
    const { username, password, role, organization } = req.body as UpdateUserBody

    const existingUser = await query('SELECT id, username, role, organization FROM users WHERE id = $1 LIMIT 1', [req.params.id])
    const user = existingUser.rows[0]
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Only allow users to update their own account unless they're an admin
    if (req.user?.role !== 'admin' && req.user?.id !== req.params.id) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    // If updating username, check if new username already exists
    if (username && username !== user.username) {
      const dup = await query('SELECT 1 FROM users WHERE username = $1 AND id <> $2 LIMIT 1', [username, req.params.id])
      if (dup.rowCount && dup.rowCount > 0) {
        res.status(400).json({ error: 'Username already exists' })
        return
      }
    }

    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (username) {
      updates.push(`username = $${idx++}`)
      values.push(username)
    }
    if (password) {
      updates.push(`password_hash = $${idx++}`)
      values.push(await bcrypt.hash(password, 10))
    }
    if (role && req.user?.role === 'admin') {
      if (!allowedRoles.includes(role)) {
        res.status(400).json({ error: 'Invalid role' })
        return
      }
      updates.push(`role = $${idx++}`)
      values.push(role)
    }
    if (organization && req.user?.role === 'admin') {
      if (!allowedOrganizations.includes(organization)) {
        res.status(400).json({ error: 'Organization must be either "EDSU" or "TokoBuku"' })
        return
      }
      updates.push(`organization = $${idx++}`)
      values.push(organization)
    }

    if (updates.length === 0) {
      res.json(mapUser(user))
      return
    }

    updates.push(`updated_at = now()`)
    values.push(req.params.id)

    const updated = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, role, organization`,
      values
    )

    res.json(mapUser(updated.rows[0]))
  } catch (error) {
    next(error)
  }
}

// DELETE user (protected, admin only)
const deleteUser: AuthRequestHandler<{ id: string }> = async (req, res, next): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// POST register new user
const registerUser: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { username, password, organization } = req.body as CreateUserBody

    if (!allowedOrganizations.includes(organization)) {
      res.status(400).json({ error: 'Organization must be either "EDSU" or "TokoBuku"' })
      return
    }

    // Check if username already exists
    const existingUser = await query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [username])
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      res.status(400).json({ error: 'Username already exists' })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with default role (editor)
    const userResult = await query(
      'INSERT INTO users (username, password_hash, role, organization) VALUES ($1, $2, $3, $4) RETURNING id, username, role, organization',
      [username, hashedPassword, 'editor', organization]
    )
    const user = userResult.rows[0]

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

    const userResponse: AuthResponse = {
      user: mapUser(user),
      token
    }

    res.status(201).json(userResponse)
  } catch (error) {
    next(error)
  }
}

// POST login user
const loginUser: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { username, password } = req.body

    // Find user and include password for comparison
    const result = await query(
      'SELECT id, username, password_hash, role, organization FROM users WHERE username = $1 LIMIT 1',
      [username]
    )
    const user = result.rows[0]
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' })
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

    const userResponse: AuthResponse = {
      user: mapUser(user),
      token
    }

    res.json(userResponse)
  } catch (error) {
    next(error)
  }
}

// GET current user (protected)
const getCurrentUser: AuthRequestHandler = async (req, res, next): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, username, role, organization FROM users WHERE id = $1 LIMIT 1',
      [req.user?.id]
    )
    const user = result.rows[0]
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (error) {
    next(error)
  }
}

// Routes
router.get('/', authMiddleware, getAllUsers)
router.get('/:id', authMiddleware, getUserById)
router.post('/', authMiddleware, createUser)
router.put('/:id', authMiddleware, updateUser as RequestHandler)
router.delete('/:id', authMiddleware, deleteUser as RequestHandler)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me/current', authMiddleware, getCurrentUser as RequestHandler)

export default router
