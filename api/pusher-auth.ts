import type { VercelRequest, VercelResponse } from '@vercel/node'
import Pusher from 'pusher'
import * as crypto from 'crypto'

function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  )
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

function getPusher(): Pusher {
  return new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true
  })
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

  try {
    if (!isPusherConfigured()) {
      return res.status(503).json({ success: false, error: 'Realtime not configured' })
    }

    const authHeader = req.headers['authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    const token = authHeader.substring('Bearer '.length).trim()

    const { socket_id, channel_name, conversationId, conversationToken, iat } = req.body as Record<string, string>
    if (!socket_id || !channel_name || !conversationId || !conversationToken || !iat) {
      return res.status(400).json({ success: false, error: 'Missing fields' })
    }

    const secret = process.env.CONVERSATION_SECRET
    if (!secret) {
      return res.status(503).json({ success: false, error: 'Server not configured' })
    }
    const { username } = decodeToken(token)
    if (!username) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    const expected = sign(username, conversationId, Number(iat), secret)
    if (expected !== conversationToken) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    const expectedChannel = `private-chat-${conversationId}`
    if (channel_name !== expectedChannel) {
      return res.status(403).json({ success: false, error: 'Invalid channel' })
    }

    const pusher = getPusher()
    const auth = pusher.authenticate(socket_id, channel_name)
    return res.status(200).json(auth)
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

