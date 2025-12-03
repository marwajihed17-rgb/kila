import type { VercelRequest, VercelResponse } from '@vercel/node'
import Pusher from 'pusher'
import crypto from 'crypto'

function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  )
}

function base64urlDecode(input: string): Buffer {
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) input += '='.repeat(4 - pad)
  return Buffer.from(input, 'base64')
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
    // Validate conversationToken signature
    const parts = conversationToken.split('.')
    if (parts.length !== 2) {
      return res.status(403).json({ success: false, error: 'Invalid token' })
    }
    const payloadBuf = base64urlDecode(parts[0])
    const sigBuf = base64urlDecode(parts[1])
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadBuf).digest()
    if (!crypto.timingSafeEqual(sigBuf, expectedSig)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    const parsed = JSON.parse(payloadBuf.toString('utf8')) as { conversationId: string; iat: number }
    if (parsed.conversationId !== conversationId || String(parsed.iat) !== String(iat)) {
      return res.status(403).json({ success: false, error: 'Token mismatch' })
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
