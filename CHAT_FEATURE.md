# 💬 AI Chat Feature - Multiple Async Responses

## Overview

This application includes a powerful AI chat interface that supports **multiple asynchronous responses** from n8n workflows, creating a streaming-like experience using a simple polling mechanism.

## ✨ Key Features

- **Multiple Async Responses**: n8n can send 2, 3, or more responses for a single user message
- **Real-time Updates**: Frontend polls every 1 second for new messages
- **Stateless Architecture**: No server-side chat storage - everything in localStorage
- **Privacy-First**: Each user's chat is isolated by sessionId
- **Simple Integration**: Easy n8n workflow setup with provided templates
- **Vercel Compatible**: Uses polling instead of SSE for Vercel compatibility

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│  ChatInterface Component                                         │
│  ├─ localStorage (sessionId, username, chat history)             │
│  ├─ POST to n8n webhook (send message)                           │
│  └─ Poll GET /api/get-updates every 1s (receive responses)       │
└────────────┬────────────────────────────────────────┬───────────┘
             │                                        │
             ▼                                        ▼
    ┌────────────────┐                      ┌──────────────────┐
    │  n8n Workflow  │                      │  Vercel Backend  │
    ├────────────────┤                      ├──────────────────┤
    │ 1. Webhook     │                      │ API Endpoints:   │
    │ 2. Process     │──POST Response #1──▶ │ /api/receive-    │
    │ 3. AI (opt)    │──POST Response #2──▶ │    response      │
    │ 4. Multiple    │──POST Response #3──▶ │                  │
    │    HTTP Calls  │                      │ /api/get-updates │
    │ 5. Respond     │                      │                  │
    └────────────────┘                      └──────────────────┘
                                                     │
                                                     ▼
                                            In-Memory Storage
                                            (5 min TTL, auto-cleanup)
```

## 🚀 Quick Start

### 1. Enable Chat Module

Add "chat" to user's modules in Google Sheets:

```csv
id,username,password,modules
1,user1,pass123,"chat,invoice,kdr"
```

Or update the `hasAccess` function in Dashboard to allow all users:

```typescript
const hasAccess = (moduleKey: string) => {
  if (moduleKey === 'chat') return true; // Always allow chat
  return userModules.includes(moduleKey.toLowerCase());
};
```

### 2. Set Up n8n Workflow

#### Option A: Import Template (Recommended)

1. Open n8n
2. Click **Workflows** → **Import from File**
3. Select `n8n-chat-workflow.json` from this repo
4. Update the `vercelApiUrl` in "Set Variables" node to your Vercel URL
5. Activate the workflow
6. Copy the webhook URL

#### Option B: Manual Setup

Follow the detailed guide in `N8N_SETUP_GUIDE.md`

### 3. Configure Frontend

Set the n8n webhook URL in one of these ways:

**Method 1: Environment Variable (Recommended)**
```bash
# .env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/chat
```

**Method 2: Browser localStorage**
```javascript
// Open browser console on the chat page
localStorage.setItem('n8nWebhookUrl', 'https://your-n8n-instance.app.n8n.cloud/webhook/chat');
```

### 4. Deploy to Vercel

```bash
# Install dependencies
npm install

# Deploy
vercel --prod
```

Make sure to set environment variables in Vercel dashboard:
- `GOOGLE_SHEET_URL`
- `VITE_GOOGLE_SHEET_URL`
- `VITE_N8N_WEBHOOK_URL` (optional)

## 📝 How It Works

### Frontend Flow

1. User opens Chat interface
2. Component generates/retrieves `sessionId` from localStorage
3. User types message and clicks Send
4. Message is sent to n8n webhook with `sessionId`, `message`, and `username`
5. Component starts polling `/api/get-updates?sessionId=xxx` every 1 second
6. New messages arrive and are displayed in real-time
7. Chat history is saved to localStorage

### Backend Flow (Vercel API)

**POST /api/receive-response** (called by n8n)
```javascript
// Input from n8n
{
  "sessionId": "session_123456",
  "reply": "Here's my response..."
}

// Stores in memory temporarily
messageStore.set(sessionId, [...messages, newMessage]);

// Auto-cleanup after 5 minutes (TTL)
```

**GET /api/get-updates** (polled by frontend)
```javascript
// Input from frontend
?sessionId=session_123456

// Output
{
  "success": true,
  "messages": [
    { "reply": "Response 1", "timestamp": 1234567890 },
    { "reply": "Response 2", "timestamp": 1234567891 }
  ],
  "count": 2
}

// Immediately clears messages after sending (stateless)
```

### n8n Workflow Flow

1. **Webhook Trigger**: Receives user message
2. **Set Variables**: Extract sessionId, message, username
3. **HTTP #1**: Send "Analyzing..." to `/api/receive-response`
4. **Wait**: Optional delay (2 seconds)
5. **HTTP #2**: Send "Processing..." to `/api/receive-response`
6. **AI Node** (optional): Generate AI response
7. **HTTP #3**: Send final response to `/api/receive-response`
8. **Respond to Webhook**: Acknowledge receipt

## 🎨 Customization

### Adding AI Integration

Add an OpenAI or Claude node in your n8n workflow:

```
HTTP #1 (Analyzing)
   ↓
OpenAI/Claude Node
   ↓
HTTP #2 (AI Response)
   ↓
Respond to Webhook
```

**OpenAI Node Configuration:**
- Model: gpt-4 or gpt-3.5-turbo
- Prompt: `{{ $node["Set Variables"].json["userMessage"] }}`

**Claude Node Configuration:**
- Model: claude-3-sonnet
- Prompt: `{{ $node["Set Variables"].json["userMessage"] }}`

Then update the HTTP request body:
```
reply: {{ $json.message.content[0].text }}
```

### Changing Polling Interval

Edit `ChatInterface.tsx`:

```typescript
pollingIntervalRef.current = setInterval(async () => {
  // ... polling logic
}, 500); // Change from 1000ms to 500ms for faster updates
```

**Recommended values:**
- Fast: 500ms (more load, faster updates)
- Normal: 1000ms (balanced)
- Slow: 2000ms (less load, slower updates)

### Adding More Response Steps

Simply add more HTTP Request nodes in n8n:

```
Webhook
  ↓
Set Variables
  ↓
HTTP #1 → "Step 1: Received"
  ↓
HTTP #2 → "Step 2: Analyzing"
  ↓
HTTP #3 → "Step 3: Processing with AI"
  ↓
HTTP #4 → "Step 4: Formatting response"
  ↓
HTTP #5 → "Step 5: Final result"
  ↓
Respond to Webhook
```

### Custom Message Styling

Edit the message rendering in `ChatInterface.tsx`:

```tsx
<div className={`max-w-[70%] rounded-lg px-4 py-3 ${
  message.sender === 'user'
    ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
    : 'bg-gray-800 text-white border border-gray-700'
}`}>
  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
  <p className="text-xs mt-1 text-gray-400">
    {new Date(message.timestamp).toLocaleTimeString()}
  </p>
</div>
```

## 🔒 Privacy & Security

### Data Storage

- **Frontend**: Messages stored in browser's localStorage
- **Backend**: Temporary in-memory storage (auto-deleted after 5 minutes)
- **n8n**: No storage (workflow executions can be logged by n8n)

### Session Isolation

- Each user gets a unique `sessionId`
- Messages are filtered by `sessionId` in `/api/get-updates`
- Users cannot see each other's messages

### Best Practices

1. **Clear Chat**: Users can clear their chat history anytime (localStorage)
2. **No Server Storage**: Never store chat history server-side
3. **TTL Cleanup**: Old messages auto-delete after 5 minutes
4. **CORS Security**: API endpoints have CORS enabled (restrict in production)
5. **Rate Limiting**: Add rate limiting to prevent abuse (not included)

## 🧪 Testing

### Test Locally

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5173
# Login and navigate to Chat
# Send test message
```

### Test with n8n

1. Create a simple workflow with 3 HTTP responses
2. Send a message in the chat
3. Watch responses appear one by one
4. Check browser console for polling logs
5. Check n8n execution logs

### Debug Checklist

- ✅ n8n workflow is activated
- ✅ Webhook URL is correct in localStorage/env
- ✅ Vercel API endpoints are deployed
- ✅ sessionId is being generated
- ✅ Polling is working (check browser console)
- ✅ CORS headers are set correctly
- ✅ User has "chat" module access

## 📊 Performance Considerations

### Frontend

- **Polling**: 1 request per second per user
- **localStorage**: Limited by browser (typically 5-10 MB)
- **Memory**: Messages cleared from state when user navigates away

### Backend (Vercel)

- **Serverless**: Cold starts possible (first request may be slower)
- **Memory**: In-memory storage shared across requests in same instance
- **Concurrency**: Vercel handles multiple concurrent users
- **Cleanup**: Automatic cleanup every 5 minutes

### n8n

- **Execution Time**: Workflow should complete within 30 seconds
- **Rate Limits**: Depends on your n8n plan
- **Webhooks**: Can handle high concurrency

## 🚨 Troubleshooting

### Issue: No messages appearing

**Check:**
1. Browser console for polling errors
2. n8n workflow execution logs
3. Vercel function logs
4. Webhook URL is correct

### Issue: Duplicate messages

**Solution:**
- Messages should be cleared after retrieval
- Check if multiple polling intervals are running
- Clear localStorage and refresh

### Issue: CORS errors

**Solution:**
- Vercel API endpoints have CORS enabled
- Check n8n webhook CORS settings
- Verify Vercel deployment is live

### Issue: Messages not clearing

**Solution:**
- TTL is set to 5 minutes
- Manual cleanup in `/api/get-updates` after retrieval
- If persisting, check messageStore logic

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `src/components/ChatInterface.tsx` | Main chat UI component |
| `api/receive-response.ts` | Receives POSTs from n8n |
| `api/get-updates.ts` | Frontend polls for new messages |
| `n8n-chat-workflow.json` | n8n workflow template |
| `N8N_SETUP_GUIDE.md` | Detailed n8n setup guide |
| `.env.example` | Environment variables template |

## 🎯 Future Enhancements

Potential improvements (not included):

1. **WebSocket Support**: For platforms that support long-lived connections
2. **Message Persistence**: Optional backend storage
3. **User Authentication**: Secure n8n webhook with tokens
4. **Rate Limiting**: Prevent abuse
5. **Typing Indicators**: Show when AI is processing
6. **Message Reactions**: Allow users to react to messages
7. **Conversation History**: Multiple conversation threads
8. **Export Chat**: Download chat history as JSON/PDF
9. **Voice Input**: Speech-to-text integration
10. **Multi-language**: i18n support

## 🤝 Contributing

To add new features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This chat feature is part of the PAA-Solutions Tool and follows the same license as the main project.

---

**Need help?** Check `N8N_SETUP_GUIDE.md` for detailed setup instructions.
