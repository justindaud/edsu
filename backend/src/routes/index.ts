import express from 'express'
import userRoutes from './userRoutes'
import programRoutes from './programRoutes'
import mediaRoutes from './mediaRoutes'
import articleRoutes from './articleRoutes'
import authRoutes from './authRoutes'
import uploadRoutes from './uploadRoutes'
import beEmRoutes from './beEmRoutes'
import artistRoutes from './artists'

const router = express.Router()

// Public routes (no auth required)
router.use('/programs', programRoutes)
router.use('/articles', articleRoutes)
router.use('/media', mediaRoutes)
router.use('/artists', artistRoutes)
router.use('/be-em', beEmRoutes)

// Auth routes
router.use('/auth', authRoutes)

// Protected routes (require auth)
router.use('/users', userRoutes)
router.use('/upload', uploadRoutes)
export default router 
