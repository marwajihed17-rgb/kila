import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface SessionInitBody {
  conversationId: string
}

function base64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
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

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request body' })
  }

  const { conversationId } = req.body as SessionInitBody
  if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length < 3 || !/[a-zA-Z0-9]/.test(conversationId)) {
    return res.status(400).json({ success: false, error: 'Invalid conversationId' })
  }

  const iat = Date.now()
  const payload = { conversationId: conversationId.trim(), iat }
  const payloadStr = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest()
  const conversationToken = `${base64url(payloadStr)}.${base64url(signature)}`
  return res.status(200).json({ success: true, conversationToken, iat })
}
