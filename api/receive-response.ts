import { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";

// -------------------------
//  SAFE PUSHER INITIALIZER
// -------------------------
function getPusher(): Pusher {
  return new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });
}

// -------------------------
//  API ROUTE HANDLER
// -------------------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 1) METHOD CHECK
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 2) BODY CHECK
    if (!req.body) {
      return res.status(400).json({ error: "Missing JSON body" });
    }

    const { conversationId, message, userId } = req.body;

    // 3) REQUIRED FIELD VALIDATION
    if (!conversationId || !message || !userId) {
      return res.status(400).json({
        error: "Missing required fields: conversationId, message, userId",
      });
    }

    // 4) PREPARE PAYLOAD
    const payload = {
      conversationId,
      message,
      userId,
      from: "n8n-response",
      timestamp: Date.now(),
    };

    // 5) SEND THROUGH PUSHER
    const channel = `chat-${conversationId}`;
    const pusher = getPusher();

    await pusher.trigger(channel, "new-message", payload);

    // 6) RETURN TO N8N (VERY IMPORTANT)
    return res.status(200).json({
      success: true,
      sentTo: channel,
      payload,
    });
  } catch (err: any) {
    console.error("CRASH IN receive-response:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err?.message,
    });
  }
}
