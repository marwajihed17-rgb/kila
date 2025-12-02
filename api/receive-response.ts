import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // If user opens the endpoint in browser:
    if (req.method === "GET") {
      return res.status(200).json({
        status: "ok",
        message: "This endpoint only accepts POST requests from n8n.",
      });
    }

    // Only process POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const body = req.body; // Next.js automatically parses JSON

    console.log("Received from n8n:", body);

    // send message to your chat (if needed)
    // ...

    return res.status(200).json({ success: true, received: body });
  } catch (error) {
    console.error("ERROR in receive-response:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
