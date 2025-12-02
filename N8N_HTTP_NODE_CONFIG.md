# n8n HTTP Request Node Configuration

## 🚨 Common Error: 500 Server Error

If you're getting a **500 error** from the Vercel endpoint, the most likely cause is:

### ❌ Vercel KV/Upstash Not Connected
**This is the #1 cause of 500 errors!**

The API endpoints REQUIRE Redis storage to work. Without it, they will crash with a 500 error.

**Solution**:
1. Go to Vercel dashboard → Storage → Create Database
2. Choose **Upstash Redis** or **KV**
3. **Connect it to your project** (this is critical!)
4. Wait for Vercel to redeploy
5. Test again

See [VERCEL_KV_SETUP.md](./VERCEL_KV_SETUP.md) for detailed instructions.

---

## ✅ Correct HTTP Request Node Configuration

### Option 1: Using JSON Body (Recommended)

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://your-app.vercel.app/api/receive-response",
    "authentication": "none",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ { \"sessionId\": $json.sessionId, \"reply\": $json.reply } }}",
    "options": {}
  },
  "name": "Send to Vercel",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

### Option 2: Using Body Parameters (Alternative)

For older n8n versions or if you prefer using parameters:

1. **Method**: `POST`
2. **URL**: `https://your-app.vercel.app/api/receive-response`
3. **Authentication**: `None`
4. **Send Body**: `Yes`
5. **Body Content Type**: `JSON`
6. **Specify Body**: `Using Fields Below`
7. **Body Parameters**:
   - **Name**: `sessionId`, **Value**: `{{ $json.sessionId }}`
   - **Name**: `reply`, **Value**: `{{ $json.reply }}`

---

## 📝 Step-by-Step Setup in n8n UI

### Method 1: Manual Configuration

1. Add an **HTTP Request** node to your workflow
2. Configure as follows:

   **Request Settings:**
   - **Method**: `POST`
   - **URL**: `https://your-app.vercel.app/api/receive-response`
     - ⚠️ Replace `your-app.vercel.app` with your actual Vercel domain

   **Authentication:**
   - **Authentication**: `None`

   **Body/Parameters:**
   - **Send Body**: ✅ Enabled
   - **Body Content Type**: `JSON`
   - **Specify Body**: `Using JSON`
   - **JSON**:
     ```json
     {
       "sessionId": "{{ $json.sessionId }}",
       "reply": "{{ $json.reply }}"
     }
     ```

   **Options:**
   - **Timeout**: `10000` (10 seconds)
   - Leave other options as default

3. **Test the node** - Should return:
   ```json
   {
     "success": true,
     "message": "Message stored successfully"
   }
   ```

### Method 2: Import JSON

1. In n8n workflow editor, click the **"+"** button
2. Select **HTTP Request**
3. Click the **⋮** menu (three dots) on the node
4. Select **"Import from JSON"**
5. Paste the JSON from `n8n-http-request-node.json`
6. Update the URL with your Vercel domain

---

## 🔍 Debugging 500 Errors

### Check 1: Verify Vercel KV is Connected

```bash
# In your Vercel dashboard
Project → Settings → Environment Variables

# Look for these variables:
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_URL=redis://...
```

If these are missing, **KV/Upstash is not connected!**

### Check 2: Test Endpoint Directly

Use curl or Postman to test:

```bash
curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "reply": "Test message"
  }'
```

**Expected response (success)**:
```json
{
  "success": true,
  "message": "Message stored successfully"
}
```

**Error response (KV not connected)**:
```json
{
  "success": false,
  "error": "Failed to store message",
  "message": "KV_REST_API_URL is not defined"
}
```

### Check 3: View Vercel Function Logs

1. Go to Vercel dashboard
2. **Deployments** → Click your latest deployment
3. **Functions** tab
4. Click `/api/receive-response`
5. Check the logs for error details

Common errors:
- `KV_REST_API_URL is not defined` → KV not connected
- `Cannot read property 'sessionId'` → Wrong request format
- `Timeout` → Network or n8n issue

---

## 📋 Complete Example Workflow

Here's a complete n8n workflow with proper HTTP nodes:

### Node 1: Webhook (Trigger)
```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "chat",
    "responseMode": "lastNode"
  },
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "position": [250, 300]
}
```

### Node 2: Set Variables
```json
{
  "parameters": {
    "values": {
      "string": [
        {
          "name": "sessionId",
          "value": "={{ $json.body.sessionId }}"
        },
        {
          "name": "userMessage",
          "value": "={{ $json.body.message }}"
        },
        {
          "name": "reply",
          "value": "Processing your request..."
        }
      ]
    },
    "options": {}
  },
  "name": "Set Variables",
  "type": "n8n-nodes-base.set",
  "position": [450, 300]
}
```

### Node 3: HTTP Request - Send Response
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://your-app.vercel.app/api/receive-response",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ { \"sessionId\": $json.sessionId, \"reply\": $json.reply } }}"
  },
  "name": "Send Response",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [650, 300]
}
```

### Node 4: Respond to Webhook
```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ { \"success\": true, \"message\": \"Processing started\" } }}"
  },
  "name": "Respond to Webhook",
  "type": "n8n-nodes-base.respondToWebhook",
  "position": [850, 300]
}
```

---

## 🧪 Testing Your Configuration

### Test 1: Send Test Request from n8n

1. In n8n, click **"Execute Node"** on your HTTP Request node
2. Make sure previous nodes have data with `sessionId` and `reply`
3. Check the output:
   - ✅ **Status 200** + `"success": true` → Working!
   - ❌ **Status 500** → Check Vercel KV connection
   - ❌ **Status 400** → Check request body format

### Test 2: Check Messages are Stored

After sending a test message, immediately call the get-updates endpoint:

```bash
curl "https://your-app.vercel.app/api/get-updates?sessionId=test-123"
```

**Expected response**:
```json
{
  "success": true,
  "messages": [
    {
      "reply": "Test message",
      "timestamp": 1733012088000
    }
  ],
  "count": 1
}
```

---

## 🎯 Quick Troubleshooting Checklist

- [ ] Vercel KV/Upstash is created in Vercel dashboard
- [ ] KV/Upstash is **connected** to your project
- [ ] Environment variables are set (check Settings → Environment Variables)
- [ ] Latest code is deployed
- [ ] HTTP Request URL matches your Vercel domain
- [ ] Request body includes both `sessionId` and `reply`
- [ ] Content-Type is `application/json`

---

## 💡 Pro Tips

1. **Always test endpoints with curl first** before configuring n8n
2. **Check Vercel function logs** for detailed error messages
3. **Use n8n's "Execute Node" feature** to test individual nodes
4. **Enable n8n workflow executions logging** to see full request/response data
5. **Start simple** - Test with hardcoded values before using dynamic expressions

---

## 🆘 Still Not Working?

1. **Verify KV is connected**: Vercel Dashboard → Storage → Check if database is connected
2. **Check deployment status**: Vercel Dashboard → Deployments → Ensure latest is deployed
3. **View function logs**: Vercel Dashboard → Functions → `/api/receive-response` logs
4. **Test endpoint directly**: Use curl/Postman to isolate if it's an n8n issue
5. **Check n8n logs**: n8n Dashboard → Executions → View error details

---

**Need more help?** Open an issue with:
- Full error message from n8n
- Vercel function logs
- Screenshot of your HTTP Request node configuration
