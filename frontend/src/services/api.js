import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const IMGBB_API_KEY = 'b39c1de7f5b734c8591b86741fdce567'

const api = axios.create({ baseURL: BASE, timeout: 15000 })

// ── ImgBB Image Storage ───────────────────────────────────────────

export const uploadToImgBB = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData)
    if (res.data && res.data.data && res.data.data.url) {
      return {
        url: res.data.data.url,
        display_url: res.data.data.display_url || res.data.data.url,
        delete_url: res.data.data.delete_url
      }
    }
  } catch (err) {
    console.warn('ImgBB upload error, falling back to local storage:', err.message)
  }
  throw new Error('ImgBB upload failed')
}

// ── Tickets ──────────────────────────────────────────────────────

export const getTickets = (params = {}) =>
  api.get('/api/tickets/', { params }).then(r => r.data)

export const getTicket = (id) =>
  api.get(`/api/tickets/${id}`).then(r => r.data)

export const createTicket = (data) =>
  api.post('/api/tickets/', data).then(r => r.data)

export const updateTicket = (id, data) =>
  api.patch(`/api/tickets/${id}`, data).then(r => r.data)

export const addActivity = (ticketId, data) =>
  api.post(`/api/tickets/${ticketId}/activities`, data).then(r => r.data)

// ── ML Prediction ─────────────────────────────────────────────────

export const predictPriority = (data) =>
  api.post('/api/predict-priority', data).then(r => r.data)

// ── Analytics ─────────────────────────────────────────────────────

export const getAnalytics = () =>
  api.get('/api/analytics/').then(r => r.data)

// ── Model ─────────────────────────────────────────────────────────

export const getModelInfo = () =>
  api.get('/api/model/info').then(r => r.data)

export const getTrainingLogs = () =>
  api.get('/api/model/training-logs').then(r => r.data)

export const retrainModel = () =>
  api.post('/api/model/retrain').then(r => r.data)

// ── User Tokens & Quota ───────────────────────────────────────────

export const getUserTokens = (email) =>
  api.get(`/api/tokens/user/${encodeURIComponent(email)}`).then(r => r.data)

export const redeemToken = (customer_email, token_code) =>
  api.post('/api/tokens/redeem', { customer_email, token_code }).then(r => r.data)

export const generateToken = (data) =>
  api.post('/api/tokens/generate', data).then(r => r.data)

export const getAllTokens = () =>
  api.get('/api/tokens/all').then(r => r.data)
