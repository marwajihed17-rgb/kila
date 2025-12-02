# n8n Multiple Async Responses Chat Setup Guide

## 🎯 Overview

This guide will help you set up an n8n workflow that sends **MULTIPLE asynchronous responses** back to your frontend chat application using a polling-based approach.

## 📋 Architecture

```
User → Frontend Chat → n8n Webhook
                         ↓
                    [Process Message]
                         ↓
                    HTTP POST #1 → Vercel /api/receive-response → "Analyzing..."
                         ↓
                    HTTP POST #2 → Vercel /api/receive-response → "Processing data..."
                         ↓
                    HTTP POST #3 → Vercel /api/receive-response → "Final result!"
                         ↓
                    [Workflow ends]

Frontend ← Polls every 1s ← Vercel /api/get-updates ← Temporary storage
```

## 🔧 Prerequisites

1. **Redis Storage (REQUIRED)** - You MUST set this up first!
   - Use Upstash Redis (recommended) or Vercel KV (legacy)
   - See [VERCEL_KV_SETUP.md](./VERCEL_KV_SETUP.md) for setup instructions
   - Without Redis storage, the webhook will NOT work
2. **n8n instance** (cloud or self-hosted)
3. **Vercel deployment** of this app (with API endpoints live)
4. **Your Vercel app URL** (e.g., `https://your-app.vercel.app`)

## 📝 Step-by-Step Setup

### Step 1: Create n8n Workflow

1. Log into your n8n instance
2. Create a new workflow
3. Add the following nodes:

#### Node 1: Webhook (Trigger)
- **Type**: Webhook
- **HTTP Method**: POST
- **Path**: `chat` (or any path you prefer)
- **Response Mode**: "When Last Node Finishes"
- **Response Data**: "First Entry JSON"

This creates an endpoint like: `https://your-n8n-instance.app.n8n.cloud/webhook/chat`

#### Node 2: Set Variables
- **Type**: Set
- **Keep Only Set**: false
- **Values**:
  - `sessionId` = `{{ $json.body.sessionId }}`
  - `userMessage` = `{{ $json.body.message }}`
  - `username` = `{{ $json.body.username }}`
  - `vercelApiUrl` = `https://your-app.vercel.app/api/receive-response`

Replace `your-app.vercel.app` with your actual Vercel domain.

#### Node 3: HTTP Request #1 - First Response
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `{{ $node["Set Variables"].json["vercelApiUrl"] }}`
- **Authentication**: None
- **Body Content Type**: JSON
- **Specify Body**: Using Fields Below
- **Body Parameters**:
  - `sessionId` = `{{ $node["Set Variables"].json["sessionId"] }}`
  - `reply` = `🔍 Analyzing your message...`

#### Node 4: Wait (Optional)
- **Type**: Wait
- **Resume**: After Time Interval
- **Wait Time**: 2 seconds

This simulates processing time. Remove if not needed.

#### Node 5: HTTP Request #2 - Processing Response
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `{{ $node["Set Variables"].json["vercelApiUrl"] }}`
- **Authentication**: None
- **Body Content Type**: JSON
- **Specify Body**: Using Fields Below
- **Body Parameters**:
  - `sessionId` = `{{ $node["Set Variables"].json["sessionId"] }}`
  - `reply` = `⚙️ Processing: {{ $node["Set Variables"].json["userMessage"] }}`

#### Node 6: Wait (Optional)
- **Type**: Wait
- **Resume**: After Time Interval
- **Wait Time**: 2 seconds

#### Node 7: HTTP Request #3 - Final Response
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `{{ $node["Set Variables"].json["vercelApiUrl"] }}`
- **Authentication**: None
- **Body Content Type**: JSON
- **Specify Body**: Using Fields Below
- **Body Parameters**:
  - `sessionId` = `{{ $node["Set Variables"].json["sessionId"] }}`
  - `reply` = `✅ Completed! Here's your response: [Your AI-generated content here]`

You can add AI nodes (OpenAI, Claude, etc.) between these steps to generate actual responses.

#### Node 8: Respond to Webhook
- **Type**: Respond to Webhook
- **Respond**: Using 'Respond to Webhook' Node
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Processing started"
  }
  ```

### Step 2: Advanced Example with AI Integration

For AI-powered responses, add these nodes between the HTTP requests:

#### OpenAI/Claude Node (between HTTP #2 and #3)
- **Type**: OpenAI / Anthropic Claude
- **Resource**: Message a Model
- **Model**: gpt-4 / claude-3-sonnet
- **Prompt**: `{{ $node["Set Variables"].json["userMessage"] }}`

Then update HTTP Request #3:
- **Body Parameters**:
  - `sessionId` = `{{ $node["Set Variables"].json["sessionId"] }}`
  - `reply` = `{{ $json.message.content[0].text }}` (for AI response)

### Step 3: Connect Nodes

Connect the nodes in this order:
1. Webhook → Set Variables
2. Set Variables → HTTP #1
3. HTTP #1 → Wait
4. Wait → HTTP #2
5. HTTP #2 → Wait
6. Wait → HTTP #3 (or AI Node → HTTP #3)
7. HTTP #3 → Respond to Webhook

### Step 4: Activate Workflow

1. Save the workflow
2. Click **"Activate"** toggle (top right)
3. Copy the webhook URL

The webhook URL will look like:
```
https://your-n8n-instance.app.n8n.cloud/webhook/chat
```

### Step 5: Configure Frontend

1. Open your browser console on the chat page
2. Run this command to set the n8n webhook URL:

```javascript
localStorage.setItem('n8nWebhookUrl', 'https://your-n8n-instance.app.n8n.cloud/webhook/chat');
```

Or add it to your `.env` file:
```
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/chat
```

And update the ChatInterface component to use it:
```typescript
const storedWebhookUrl = localStorage.getItem('n8nWebhookUrl') ||
                         import.meta.env.VITE_N8N_WEBHOOK_URL || '';
```

## 🧪 Testing

1. Open the chat interface in your app
2. Send a test message: "Hello"
3. You should see responses appear one by one:
   - "🔍 Analyzing your message..."
   - "⚙️ Processing: Hello"
   - "✅ Completed! Here's your response: ..."

## 🔍 Debugging

### Check n8n Workflow Execution
1. Go to n8n → Executions
2. Check if webhook was triggered
3. View execution log for errors

### Check Vercel Logs
```bash
vercel logs
```

### Check Browser Console
- Open DevTools → Console
- Look for polling logs
- Check for API errors

### Common Issues

**Issue**: Frontend shows "n8n webhook URL not set"
- **Solution**: Set the webhook URL in localStorage (see Step 5)

**Issue**: No messages appearing in chat
- **Solution**:
  - Check if n8n workflow is activated
  - Verify Vercel API endpoints are deployed
  - Check browser console for polling errors

**Issue**: Duplicate messages
- **Solution**: Messages are cleared after retrieval. If you see duplicates, check your polling interval.

**Issue**: CORS errors
- **Solution**: Vercel API endpoints have CORS enabled. If you still see errors, check your n8n webhook CORS settings.

## 🎨 Customization

### Add More Response Steps

Simply add more HTTP Request nodes between the existing ones:

```
HTTP #1 → Wait → HTTP #2 → Wait → HTTP #3 → ... → HTTP #N → Respond to Webhook
```

### Change Response Timing

Adjust the **Wait** node duration:
- Faster: 0.5-1 seconds
- Slower: 3-5 seconds

### Add Conditional Logic

Use **IF** nodes to send different responses based on user input:

```
Set Variables → IF Node
                  ├─ True → HTTP (Response A)
                  └─ False → HTTP (Response B)
```

### Integrate External APIs

Add HTTP Request nodes to call external APIs:

1. HTTP #1 → "Checking weather API..."
2. Call Weather API
3. HTTP #2 → "Weather: Sunny, 75°F"

## 📊 Example Workflow JSON

See `n8n-chat-workflow.json` in this repository for a complete example you can import directly into n8n.

## 🚀 Production Considerations

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Error Handling**: Add error nodes in n8n to handle failures
3. **Message Validation**: Validate sessionId and message content
4. **Security**: Add authentication to your n8n webhook
5. **Monitoring**: Set up logging and monitoring for both n8n and Vercel

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [n8n Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)

## 💡 Tips

- **Keep workflows simple**: Start with 2-3 responses, add more as needed
- **Use meaningful messages**: Help users understand what's happening
- **Test thoroughly**: Test with different message types and lengths
- **Monitor performance**: Keep an eye on response times
- **Clean up storage**: The API endpoints auto-clean old messages (5 min TTL)

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors
2. Review n8n execution logs
3. Verify all URLs are correct
4. Ensure workflow is activated
5. Test API endpoints directly with Postman/curl

---

**Happy chatting! 🚀**
