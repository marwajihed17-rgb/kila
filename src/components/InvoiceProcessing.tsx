import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, User, Trash2, LogOut, Paperclip, Send, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { apiService } from '../services/api';
import { FileAttachment } from '../types/api';

interface InvoiceProcessingProps {
  onBack: () => void;
  onLogout: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  files?: FileAttachment[];
}

export function InvoiceProcessing({ onBack, onLogout }: InvoiceProcessingProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [username, setUsername] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Get username from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || '');
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (message.trim() || attachments.length > 0) {
      const messageText = message || (attachments.length > 0 ? '' : '');

      // Convert File objects to FileAttachment objects with blob URLs
      const fileAttachments: FileAttachment[] = attachments.map(file => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        size: file.size
      }));

      const newMessage: Message = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        files: fileAttachments.length > 0 ? fileAttachments : undefined
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      setAttachments([]);

      try {
        // Send message to API
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).username : undefined;

        const response = await apiService.sendMessage(
          messageText,
          'user',
          'invoice',
          userId
        );

        if (response.success && response.botResponse) {
          const botMessage: Message = {
            id: Date.now(),
            text: response.botResponse.text,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Fallback to simulated response
        setTimeout(() => {
          const botMessage: Message = {
            id: Date.now(),
            text: 'I received your message and I\'m processing it...',
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMessage]);
        }, 1000);
      }
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper function to check if file is an image
  const isImageFile = (type: string) => {
    return type.startsWith('image/');
  };

  // Helper function to get file icon based on type
  const getFileIcon = (type: string) => {
    if (isImageFile(type)) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  // Handle file click - download for non-images, open in new tab for images
  const handleFileClick = (file: FileAttachment) => {
    if (isImageFile(file.type)) {
      // Open image in new tab
      window.open(file.url, '_blank');
    } else {
      // Trigger download for non-image files
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-[#1a1f2e]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white">Invoice Processing</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-500 text-sm">Status</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-white px-3">
              <User className="w-5 h-5" />
              <span className="text-sm">{username}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#1a1f2e]"
              onClick={handleClearMessages}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-[#1a1f2e] gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable Chat Area */}
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 hide-scrollbar">
        <div className="container mx-auto max-w-4xl h-full">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Start a conversation to begin processing</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] text-white animated-gradient'
                        : 'bg-[#1a1f2e]/80 backdrop-blur-md border border-[#2a3144] text-white'
                    }`}
                  >
                    {msg.text && (
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    )}

                    {/* Display file attachments */}
                    {msg.files && msg.files.length > 0 && (
                      <div className={`space-y-2 ${msg.text ? 'mt-2' : ''}`}>
                        {msg.files.map((file, index) => (
                          <div
                            key={index}
                            onClick={() => handleFileClick(file)}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                              msg.sender === 'user'
                                ? 'bg-white/10 hover:bg-white/20'
                                : 'bg-[#2a3144]/50 hover:bg-[#2a3144]'
                            }`}
                          >
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className={`text-xs ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <Download className="w-4 h-4 shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    <p className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md shrink-0">
        <div className="container mx-auto px-4 py-4">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="max-w-4xl mx-auto mb-3 flex gap-2 flex-wrap">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="bg-[#1a1f2e]/80 backdrop-blur-md border border-[#2a3144] rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-gray-400 hover:text-white ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <input
              type="file"
              id="file-input"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById('file-input')?.click()}
              className="text-gray-400 hover:bg-[#1a1f2e] shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-[#1a1f2e] border-[#2a3144] text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="shrink-0 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] hover:opacity-90 text-white animated-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}