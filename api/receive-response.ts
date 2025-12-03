import type { VercelRequest, VercelResponse } from '@vercel/node'
import Pusher from 'pusher'

function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  )
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
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid request body' })
    }

    const { conversationId, reply } = req.body as { conversationId?: string; reply?: string }
    if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length < 3 || !/[a-zA-Z0-9]/.test(conversationId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversationId' })
    }
    if (!reply || typeof reply !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid reply is required' })
    }

    const webhookToken = process.env.N8N_WEBHOOK_TOKEN
    if (webhookToken) {
      const authHeader = req.headers['authorization']
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }
      const provided = authHeader.substring('Bearer '.length).trim()
      if (provided !== webhookToken) {
        return res.status(403).json({ success: false, error: 'Forbidden' })
      }
    }

    if (!isPusherConfigured()) {
      return res.status(503).json({ success: false, error: 'Realtime not configured' })
    }

    const pusher = getPusher()
    const channelName = `private-chat-${conversationId.trim()}`
    const payload = {
      role: 'assistant',
      text: reply,
      timestamp: Date.now()
    }
    await pusher.trigger(channelName, 'message', payload)
    // Optional public fallback channel
    const fallbackChannel = `chat-${conversationId.trim()}`
    try {
      await pusher.trigger(fallbackChannel, 'message', payload)
    } catch (err) {
      console.log('Fallback channel failed:', err)
    }
    return res.status(200).json({ success: true, broadcasted: true, channel: channelName })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ success: false, error: 'Internal server error', message: msg })
  }
}
