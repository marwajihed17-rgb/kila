export type Attachment = {
  id: string
  name: string
  type: string
  size: number
  url?: string
  data?: string
}

export async function sendMessageToN8N(params: {
  text: string
  attachments: Attachment[]
  conversationId: string
  username: string
}) {
  const url = (import.meta.env.N8N_WEBHOOK_URL as string) || (import.meta.env.VITE_N8N_WEBHOOK_URL as string) || ''
  const token = (import.meta.env.N8N_WEBHOOK_TOKEN as string) || ''
  if (!url) throw new Error('N8N webhook URL not configured')
  const body = {
    conversationId: params.conversationId,
    username: params.username,
    text: params.text,
    attachments: params.attachments,
    timestamp: Date.now()
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Webhook failed: ${res.status}`)
  try {
    return await res.json()
  } catch (err) {
    console.error('n8n response JSON parse error', err)
    return {}
  }
}
