import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as crypto from 'crypto'

interface SessionInitBody {
  conversationId: string
}

function decodeToken(t: string) {
  try {
    const raw = Buffer.from(t, 'base64').toString('utf8')
    const idx = raw.indexOf(':')
    if (idx === -1) return { username: '' }
    return { username: raw.slice(0, idx) }
  } catch {
    return { username: '' }
  }
}

function sign(username: string, conversationId: string, iat: number, secret: string) {
  const payload = `${username}:${conversationId}:${iat}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const secret = process.env.CONVERSATION_SECRET
  if (!secret) {
    return res.status(503).json({ success: false, error: 'Server not configured' })
  }

  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.substring('Bearer '.length).trim()

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request body' })
  }

  const { conversationId } = req.body as SessionInitBody
  if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'Valid conversationId is required' })
  }

  const { username } = decodeToken(token)
  if (!username) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const iat = Date.now()
  const conversationToken = sign(username, conversationId.trim(), iat, secret)
  return res.status(200).json({ success: true, conversationToken, iat })
}

