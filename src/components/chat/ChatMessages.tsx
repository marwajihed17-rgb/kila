import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'

export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; timestamp: number; attachments?: { id: string; name: string; type: string; url?: string }[] }

export function ChatMessages({ messages, isTyping }: { messages: ChatMessage[]; isTyping: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isTyping])
  return (
    <div ref={containerRef} className="flex-1 pr-4 overflow-y-auto">
      <div className="space-y-4 pb-4">
        {messages.map(m => (
          <MessageBubble key={m.id} role={m.role} text={m.text} timestamp={m.timestamp} attachments={m.attachments} />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1a1f2e]/80 backdrop-blur-sm border border-[#2a3144] rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
