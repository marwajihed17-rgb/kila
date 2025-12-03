import { useEffect, useState } from 'react'
import Pusher from 'pusher-js'
import { ChatMessages, ChatMessage } from './ChatMessages'
import { ChatInput, AttachmentInput } from './ChatInput'
import { sendMessageToN8N } from '../../services/chatService'
import logo from 'figma:asset/220dab80c3731b3a44f7ce1394443acd5caffa99.png'

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [username, setUsername] = useState('')
  const [conversationToken, setConversationToken] = useState('')
  const [conversationIat, setConversationIat] = useState<number | null>(null)

  useEffect(() => {
    let cid = localStorage.getItem('conversationId')
    if (!cid) {
      cid = `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem('conversationId', cid)
    }
    setConversationId(cid)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        setUsername(u.username || 'User')
      } catch {
        setUsername('User')
      }
    }
  }, [])

  useEffect(() => {
    if (!conversationId) return
    const token = localStorage.getItem('authToken') || ''
    fetch('/api/session-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversationId })
    }).then(async r => {
      if (!r.ok) {
        const text = await r.text().catch(() => '')
        console.error('session-init failed', r.status, text)
        return
      }
      const data = await r.json().catch(() => ({} as any))
      if (data.conversationToken && data.iat) {
        setConversationToken(data.conversationToken)
        setConversationIat(data.iat)
      }
    }).catch(err => console.error('session-init error', err))
  }, [conversationId])

  useEffect(() => {
    if (!conversationToken || !conversationIat) return
    const key = import.meta.env.VITE_PUSHER_KEY as string
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string
    if (!key || !cluster) return
    const token = localStorage.getItem('authToken') || ''
    const pusher = new Pusher(key, {
      cluster,
      channelAuthorization: {
        endpoint: '/api/pusher-auth',
        transport: 'ajax',
        headers: { Authorization: `Bearer ${token}` },
        params: { conversationId, conversationToken, iat: String(conversationIat) }
      }
    })
    const channelName = `private-chat-${conversationId}`
    let channel = pusher.subscribe(channelName)
    channel.bind('message', (data: { role: 'assistant'; text: string; timestamp: number }) => {
      const msg: ChatMessage = { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, role: 'assistant', text: data.text, timestamp: data.timestamp }
      setMessages(prev => [...prev, msg])
      setIsTyping(false)
    })
    return () => {
      try { channel.unbind_all(); pusher.unsubscribe(channelName) } catch (err) { console.error('pusher cleanup error', err) }
      pusher.disconnect()
    }
  }, [conversationToken, conversationIat, conversationId, username])

  const onSend = async (text: string, atts: AttachmentInput[]) => {
    const userMessage: ChatMessage = { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, role: 'user', text, timestamp: Date.now(), attachments: atts.map(a => ({ id: a.id, name: a.name, type: a.type, url: a.url })) }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    await sendMessageToN8N({ text, attachments: atts.map(a => ({ id: a.id, name: a.name, type: a.type, size: a.size, url: a.url })), conversationId: conversationId || username, username })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Retaam Solutions" className="h-10" />
            <div className="flex items-center gap-2 text-white">
              <span className="font-semibold">AI Chat Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white text-sm">
            <span>{username}</span>
          </div>
        </div>
      </header>
      <div className="flex-1 container mx-auto px-6 py-6 flex flex-col max-w-4xl">
        <ChatMessages messages={messages} isTyping={isTyping} />
        <ChatInput onSend={onSend} />
        <div className="mt-3 text-xs text-gray-500">
          <p>Conversation ID: {conversationId || username}</p>
          <p>Messages are stored locally in your browser only</p>
        </div>
      </div>
      <div className="border-t border-[#2a3144] py-4">
        <div className="container mx-auto px-6 flex items-center justify-end gap-4">
          <div className="h-0.5 w-64 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] animated-gradient"></div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">PAA--Solutions Tool</p>
            <p className="text-gray-500 text-xs">WWW.PAA-Solutions.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
