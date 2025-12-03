import type { VercelRequest, VercelResponse } from '@vercel/node';

import Pusher from 'pusher';

 

function isPusherConfigured(): boolean {

  return !!(

    process.env.PUSHER_APP_ID &&

    process.env.PUSHER_KEY &&

    process.env.PUSHER_SECRET &&

    process.env.PUSHER_CLUSTER

  );

}

 

function getPusher(): Pusher {

  return new Pusher({

    appId: process.env.PUSHER_APP_ID!,

    key: process.env.PUSHER_KEY!,

    secret: process.env.PUSHER_SECRET!,

    cluster: process.env.PUSHER_CLUSTER!,

    useTLS: true

  });

}

 

export default async function handler(req: VercelRequest, res: VercelResponse) {

  // CORS headers

  res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

 

  if (req.method === 'OPTIONS') {

    return res.status(200).end();

  }

 

  try {

    // If user opens the endpoint in browser:

    if (req.method === 'GET') {

      return res.status(200).json({

        status: 'ok',

        message: 'This endpoint only accepts POST requests from n8n.',

        pusherConfigured: isPusherConfigured()

      });

    }

 

    // Only process POST

    if (req.method !== 'POST') {

      return res.status(405).json({ error: 'Method Not Allowed' });

    }

 

    // Check if Pusher is configured

    if (!isPusherConfigured()) {

      console.error('Pusher is not configured. Please set PUSHER_* environment variables.');

      return res.status(503).json({

        success: false,

        error: 'Pusher not configured',

        message: 'Please set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, and PUSHER_CLUSTER in Vercel environment variables'

      });

    }

 

    const body = req.body;

    console.log('Received from n8n:', JSON.stringify(body, null, 2));

 

    // Extract data from n8n response

    // Support multiple field names for flexibility

    const conversationId = body.conversationId || body.conversation_id || body.sessionId;

    const messageText = body.reply || body.text || body.message || body.response;

 

    // Validate required fields

    if (!conversationId) {

      console.error('Missing conversationId in request body:', body);

      return res.status(400).json({

        success: false,

        error: 'conversationId is required',

        message: 'Please include conversationId in your n8n webhook payload'

      });

    }

 

    if (!messageText) {

      console.error('Missing message content in request body:', body);

      return res.status(400).json({

        success: false,

        error: 'Message content is required',

        message: 'Please include reply, text, or message field in your n8n webhook payload'

      });

    }

 

    // Initialize Pusher

    const pusher = getPusher();

 

    // Prepare message payload

    const messagePayload = {

      role: 'assistant',

      text: messageText,

      timestamp: Date.now()

    };

 

    // Broadcast to private channel (primary channel for ChatWindow.tsx)

    const privateChannelName = `private-chat-${conversationId}`;

 

    try {

      await pusher.trigger(privateChannelName, 'message', messagePayload);

      console.log(`✅ Message broadcasted to private channel: ${privateChannelName}`);

    } catch (error) {

      console.error(`Failed to broadcast to private channel ${privateChannelName}:`, error);

    }

 

    // Also broadcast to public fallback channel

    const publicChannelName = `chat-${conversationId}`;

 

    try {

      await pusher.trigger(publicChannelName, 'message', messagePayload);

      console.log(`✅ Message broadcasted to public channel: ${publicChannelName}`);

    } catch (error) {

      console.error(`Failed to broadcast to public channel ${publicChannelName}:`, error);

    }

 

    // Also send 'new-message' event for ChatInterface.tsx compatibility

    const newMessagePayload = {

      conversationId: conversationId,

      reply: messageText,

      timestamp: Date.now()

    };

 

    try {

      await pusher.trigger(privateChannelName, 'new-message', newMessagePayload);

      console.log(`✅ 'new-message' event sent to ${privateChannelName}`);

    } catch (error) {

      console.error(`Failed to send 'new-message' event:`, error);

    }

 

    return res.status(200).json({

      success: true,

      broadcasted: true,

      channels: [privateChannelName, publicChannelName],

      message: 'Message successfully broadcasted to Pusher',

      receivedFrom: 'n8n'

    });

 

  } catch (error) {

    console.error('ERROR in receive-response:', error);

    return res.status(500).json({

      success: false,

      error: 'Internal Server Error',

      message: error instanceof Error ? error.message : 'Unknown error'

    });

  }

}