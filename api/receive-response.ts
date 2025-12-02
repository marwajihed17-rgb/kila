import type { VercelRequest, VercelResponse } from '@vercel/node';
import Pusher from "pusher";

// -------------------------
// Helper: Check Pusher env
// -------------------------
function isPusherConfigured(): boolean {
  return (
    !!process.env.PUSHER_APP_ID &&
    !!process.env.PUSHER_KEY &&
    !!process.env.PUSHER_SECRET &&
    !!process.env.PUSHER_CLUSTER
  );
}

function getPusher(): Pusher {
  return new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });
}

// -------------------------
// Main handler
// -------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    //------------------------------------
    // 1. FIX: Ensure body is parsed safely
    //------------------------------------
    let body: any = req.body;

    if (!body || typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: "Invalid JSON body",
        });
      }
    }

    const { conversationId, reply } = body;

    //------------------------------------
    // 2. Validate data
    //------------------------------------
    if (!conversationId || typeof conversationId !== "string") {
      return res.status(400).json({
        success: false,
        error: "conversationId must be a string",
      });
    }

    if (!reply || typeof reply !== "string") {
      return res.status(400).json({
        success: false,
        error: "reply must be a string",
      });
    }

    //------------------------------------
    // 3. Validate Pusher config
    //------------------------------------
    if (!isPusherConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Pusher not configured on server",
      });
    }

    const pusher = getPusher();
    const channel = `chat-${conversationId}`;

    //------------------------------------
    // 4. Trigger message to frontend
    //------------------------------------
    await pusher.trigger(channel, "message", {
      role: "assistant",
      text: reply,
      conversationId,
      timestamp: Date.now(),
    });

    console.log("Message sent to:", channel, "reply:", reply);

    return res.status(200).json({
      success: true,
      message: "Delivered",
    });

  } catch (err: any) {
    console.error("CRASH IN receive-response:", err);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "Server crashed",
        details: err?.message || "Unknown error",
      });
    }
  }
}
