import React from 'react'

export function MessageBubble({ role, text, timestamp, attachments }: { role: 'user' | 'assistant'; text: string; timestamp: number; attachments?: { id: string; name: string; type: string; url?: string }[] }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-lg px-4 py-3 ${isUser ? 'bg-gradient-to-br from-[#4A90F5] to-[#5EA3F7] text-white' : 'bg-[#1a1f2e]/80 backdrop-blur-sm border border-[#2a3144] text-white'}`}>
        <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
        {attachments && attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {attachments.map(a => (
              <div key={a.id} className="border border-[#2a3144] rounded p-2">
                {a.type.startsWith('image/') && a.url ? (
                  <img src={a.url} alt={a.name} className="max-h-48 rounded" />
                ) : (
                  <div className="text-xs text-gray-400">{a.name}</div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-gray-500'}`}>{new Date(timestamp).toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

