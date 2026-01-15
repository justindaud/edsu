import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import routes from './routes'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '@/.env.local') })

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined')
}

const app = express()
const PORT = parseInt(process.env.PORT || '5006', 10)
const HOST = process.env.HOST || '0.0.0.0'


// Middleware
app.use(cors({
  //origin: ['http://localhost:5003', 'http://localhost:5001'],
  origin : '*',
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api', routes)

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'EDSU Backend API is running' })
})

// Log environment variables (remove in production)
console.log('Environment variables loaded:')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✅' : 'Not set ❌')
console.log('PORT:', process.env.PORT || '5006 (default)')


app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`)
})
