import React, { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export type AttachmentInput = { id: string; name: string; type: string; size: number; url?: string; file?: File }

export function ChatInput({ onSend }: { onSend: (text: string, attachments: AttachmentInput[]) => Promise<void> }) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<AttachmentInput[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFiles = () => fileRef.current?.click()
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const mapped = files.map(f => ({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: f.name, type: f.type, size: f.size, url: URL.createObjectURL(f), file: f }))
    setAttachments(prev => [...prev, ...mapped])
  }

  const send = async () => {
    if (!value.trim() && attachments.length === 0) return
    await onSend(value, attachments)
    setValue('')
    setAttachments([])
  }

  return (
    <div className="pt-4 border-t border-[#2a3144]">
      <div className="mb-2 flex gap-2 flex-wrap">
        {attachments.map(a => (
          <div key={a.id} className="border border-[#2a3144] rounded px-2 py-1 text-xs text-gray-400">
            {a.name}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Type your message..." className="flex-1 bg-[#1a1f2e]/80 border-[#2a3144] text-white placeholder:text-gray-500" />
        <Button onClick={pickFiles} className="bg-[#1a1f2e] border border-[#2a3144] text-white px-4">Attach</Button>
        <Button onClick={send} className="bg-gradient-to-br from-[#4A90F5] to-[#5EA3F7] hover:from-[#5EA3F7] hover:to-[#4A90F5] text-white px-6">Send</Button>
      </div>
      <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />
    </div>
  )
}

