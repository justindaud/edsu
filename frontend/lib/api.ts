import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5006'
const BASE_URL = `${API_URL.replace(/\/$/, '')}/api`

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token from localStorage when present (client-side only)
api.interceptors.request.use(
    (config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
},
  (error) => {
    return Promise.reject(error);
  }
);

export default api
