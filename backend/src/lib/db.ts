import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars from backend/.env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL must be defined')
}

export const pool = new Pool({
  connectionString,
  // Keep the pool small for local dev; tweak for production as needed.
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000
})

export const query = (text: string, params?: any[]) => pool.query(text, params)

export default pool
