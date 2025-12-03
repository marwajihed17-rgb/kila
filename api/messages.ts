import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  category?: 'invoice' | 'kdr' | 'ga';
  userId?: string;
}

// Note: In production, you should use a proper database or KV store
// For now, this provides a basic structure for message handling
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Store a new message
      const { text, sender, category, userId } = req.body;

      if (typeof text !== 'string' || text.trim().length === 0 || text.length > 5000) {
        return res.status(400).json({ error: 'Invalid text' });
      }
      if (sender !== 'user' && sender !== 'bot') {
        return res.status(400).json({ error: 'Invalid sender' });
      }
      if (category && !['invoice', 'kdr', 'ga'].includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      if (!text || !sender) {
        return res.status(400).json({
          error: 'Text and sender are required'
        });
      }

      const message: Message = {
        id: crypto.randomBytes(16).toString('hex'),
        text,
        sender,
        timestamp: new Date().toISOString(),
        category,
        userId
      };

      // In production, save to database here
      // For now, just return the message with a simulated bot response
      const botResponse: Message = {
        id: crypto.randomBytes(16).toString('hex'),
        text: `Message received: "${text}". Processing...`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        category,
        userId
      };

      return res.status(201).json({
        success: true,
        message,
        botResponse
      });

    } else if (req.method === 'GET') {
      // Retrieve messages (in production, fetch from database)
      const { category, userId } = req.query;

      // For now, return empty array as messages aren't persisted
      return res.status(200).json({
        success: true,
        messages: [],
        category,
        userId
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
