# Testing Guide - n8n Chat with Multiple Async Responses

## 🧪 Pre-Deployment Testing

### 1. Type Checking

```bash
# Install dependencies
npm install

# Run type check
npm run type-check
```

**Expected**: No TypeScript errors

### 2. Local Development

```bash
# Start development server
npm run dev
```

**Expected**: Server starts on http://localhost:5173

### 3. Build Test

```bash
# Build for production
npm run build
```

**Expected**: Build succeeds with no errors

## 🌐 Vercel API Endpoints Testing

### Test 1: POST /api/receive-response

This endpoint receives messages from n8n.

```bash
# Test storing a message
curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_123",
    "reply": "This is a test message from n8n"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Message stored successfully"
}
```

### Test 2: GET /api/get-updates

This endpoint is polled by the frontend.

```bash
# Test retrieving messages
curl -X GET "https://your-app.vercel.app/api/get-updates?sessionId=test_session_123"
```

**Expected Response (first call - messages exist):**
```json
{
  "success": true,
  "messages": [
    {
      "reply": "This is a test message from n8n",
      "timestamp": 1234567890123
    }
  ],
  "count": 1
}
```

**Expected Response (second call - messages cleared):**
```json
{
  "success": true,
  "messages": [],
  "count": 0
}
```

### Test 3: Multiple Async Responses Flow

Simulate n8n sending multiple responses:

```bash
# Terminal 1: Start polling (in a loop)
while true; do
  echo "Polling at $(date):"
  curl -s "https://your-app.vercel.app/api/get-updates?sessionId=test_multi_123"
  echo ""
  sleep 1
done

# Terminal 2: Send multiple responses (simulate n8n)
curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_multi_123", "reply": "Response 1: Analyzing..."}'

sleep 2

curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_multi_123", "reply": "Response 2: Processing..."}'

sleep 2

curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_multi_123", "reply": "Response 3: Complete!"}'
```

**Expected**: Terminal 1 shows messages appearing over time

## 🔗 n8n Workflow Testing

### Test 4: n8n Webhook Test

1. In n8n, open your chat workflow
2. Click **"Execute Workflow"** button
3. Click **"Listen for Test Event"** on the Webhook node
4. Send a test request:

```bash
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_n8n_123",
    "message": "Hello from curl",
    "username": "testuser"
  }'
```

**Expected**:
- n8n shows the workflow execution
- All HTTP nodes execute successfully
- Messages are sent to Vercel API

### Test 5: End-to-End n8n Flow

1. Activate your n8n workflow
2. Send a production test:

```bash
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "e2e_test_456",
    "message": "Test end-to-end flow",
    "username": "e2e_user"
  }'
```

3. Poll for responses:

```bash
# Poll 5 times to catch all responses
for i in {1..5}; do
  echo "Poll $i:"
  curl -s "https://your-app.vercel.app/api/get-updates?sessionId=e2e_test_456" | jq
  sleep 2
done
```

**Expected**: See multiple responses arrive over time

## 🖥️ Frontend Testing

### Test 6: Browser Console Testing

1. Open the app in browser
2. Login with valid credentials
3. Navigate to Chat
4. Open DevTools Console (F12)
5. Check for:

```javascript
// Verify sessionId is created
console.log(localStorage.getItem('chatSessionId'));
// Expected: "session_1234567890_abcdef"

// Verify webhook URL is set
console.log(localStorage.getItem('n8nWebhookUrl'));
// Expected: "https://your-n8n-instance.app.n8n.cloud/webhook/chat"

// Verify polling is working (you should see logs every 1 second)
// Expected: Console logs like "Received X new messages from n8n"
```

### Test 7: Chat Functionality

**Test Case 1: Send Message**
1. Type "Hello" in chat input
2. Click Send button
3. **Expected**:
   - Message appears in chat immediately
   - Loading indicator shows "AI is thinking..."
   - Responses arrive one by one

**Test Case 2: Multiple Messages**
1. Send message "Test 1"
2. Wait for all responses
3. Send message "Test 2"
4. **Expected**: Each message gets separate responses

**Test Case 3: LocalStorage Persistence**
1. Send a few messages
2. Refresh the page
3. **Expected**: Chat history is preserved

**Test Case 4: Clear Chat**
1. Click "Clear Chat" button
2. Confirm the dialog
3. **Expected**: All messages are cleared

**Test Case 5: Session Isolation**
1. Open chat in browser tab 1
2. Note the sessionId in console
3. Open chat in incognito/different browser
4. **Expected**: Different sessionId, no shared messages

### Test 8: Network Tab Monitoring

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Send a message
4. **Expected**:
   - POST to n8n webhook (status 200)
   - GET to /api/get-updates every 1 second
   - Responses in the preview tab

## 🎯 Integration Testing Checklist

- [ ] User can login
- [ ] Chat module appears in Dashboard (if user has access)
- [ ] Chat interface loads without errors
- [ ] SessionId is generated and stored
- [ ] Webhook URL is configured
- [ ] Message can be sent to n8n
- [ ] Polling starts automatically
- [ ] First response appears (1-2 seconds)
- [ ] Second response appears (3-4 seconds)
- [ ] Third response appears (5-6 seconds)
- [ ] Loading indicator disappears after last response
- [ ] Messages are saved to localStorage
- [ ] Refresh preserves chat history
- [ ] Clear chat works correctly
- [ ] Logout and login preserves sessionId

## 🐛 Common Issues & Solutions

### Issue 1: "n8n webhook URL not set" warning

**Symptoms**: Yellow warning box in chat interface

**Solution**:
```javascript
// Set in localStorage
localStorage.setItem('n8nWebhookUrl', 'https://your-n8n-instance.app.n8n.cloud/webhook/chat');

// Or set in .env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/chat
```

### Issue 2: No messages appearing

**Debug Steps**:
```bash
# 1. Check if n8n workflow executed
# Go to n8n → Executions → Check latest execution

# 2. Check if messages were stored
curl "https://your-app.vercel.app/api/get-updates?sessionId=YOUR_SESSION_ID"

# 3. Check browser console for polling errors
# Look for fetch errors or CORS issues

# 4. Check Vercel logs
vercel logs --follow
```

### Issue 3: Messages appear but then disappear

**Cause**: Messages are cleared after first retrieval (by design)

**Solution**: This is expected behavior. Messages show in UI immediately and stay there. Only the backend storage is cleared.

### Issue 4: Polling not working

**Debug**:
```javascript
// Check if polling interval is running
console.log('Polling is active');

// Manually test polling
fetch('/api/get-updates?sessionId=test_123')
  .then(r => r.json())
  .then(console.log);
```

### Issue 5: CORS errors

**Symptoms**: Network errors in console, "Access-Control-Allow-Origin" errors

**Solution**:
- Vercel API endpoints have CORS enabled by default
- Check n8n webhook CORS settings
- Ensure Vercel deployment is complete

## 📊 Performance Testing

### Test 9: Load Testing

**Simulate Multiple Users:**

```bash
# Create 10 concurrent sessions
for i in {1..10}; do
  (
    SESSION_ID="load_test_$i"
    curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/chat \
      -H "Content-Type: application/json" \
      -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Load test $i\", \"username\": \"user$i\"}"

    sleep 1

    curl "https://your-app.vercel.app/api/get-updates?sessionId=$SESSION_ID"
  ) &
done

wait
```

**Expected**: All requests complete successfully

### Test 10: Polling Performance

**Monitor Network Usage:**
- Open DevTools → Network
- Enable "Preserve log"
- Let chat sit idle for 1 minute
- **Expected**: ~60 GET requests to /api/get-updates (1 per second)

## 🔐 Security Testing

### Test 11: Session Isolation

```bash
# Create message for session A
curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session_a", "reply": "Message for A"}'

# Try to retrieve with session B
curl "https://your-app.vercel.app/api/get-updates?sessionId=session_b"

# Expected: No messages (empty array)
```

### Test 12: Input Validation

```bash
# Test missing sessionId
curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{"reply": "No session ID"}'

# Expected: 400 error "sessionId and reply are required"

# Test missing reply
curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test"}'

# Expected: 400 error "sessionId and reply are required"
```

## 📝 Test Report Template

```markdown
# Test Report - Chat Feature

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [Production/Staging]

## API Endpoints
- [ ] POST /api/receive-response: ✅ Pass / ❌ Fail
- [ ] GET /api/get-updates: ✅ Pass / ❌ Fail

## n8n Integration
- [ ] Webhook trigger: ✅ Pass / ❌ Fail
- [ ] Multiple responses: ✅ Pass / ❌ Fail
- [ ] Response timing: ✅ Pass / ❌ Fail

## Frontend
- [ ] Chat UI loads: ✅ Pass / ❌ Fail
- [ ] Send message: ✅ Pass / ❌ Fail
- [ ] Receive responses: ✅ Pass / ❌ Fail
- [ ] LocalStorage: ✅ Pass / ❌ Fail
- [ ] Polling: ✅ Pass / ❌ Fail

## Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...

## Notes
[Additional observations]
```

## 🚀 Production Readiness Checklist

Before deploying to production:

- [ ] All TypeScript type checks pass
- [ ] Build completes successfully
- [ ] All API endpoints tested and working
- [ ] n8n workflow tested and activated
- [ ] Frontend sends and receives messages correctly
- [ ] LocalStorage persistence verified
- [ ] Session isolation confirmed
- [ ] CORS configured properly
- [ ] Error handling tested
- [ ] Performance acceptable (polling doesn't cause issues)
- [ ] Mobile responsive (test on phone)
- [ ] Documentation complete
- [ ] Environment variables set in Vercel
- [ ] No console errors in production build

## 📚 Additional Resources

- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [n8n Testing Docs](https://docs.n8n.io/workflows/test/)
- [Browser DevTools Guide](https://developer.chrome.com/docs/devtools/)

---

**Questions?** Refer to `N8N_SETUP_GUIDE.md` and `CHAT_FEATURE.md` for detailed documentation.
