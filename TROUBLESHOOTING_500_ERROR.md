# Troubleshooting 500 Server Errors

## Overview

If you're getting a 500 error from the n8n HTTP Request node, this guide will help you diagnose and fix the issue.

## Error Format

The error you see in n8n might look like this:

```json
{
  "errorMessage": "The service was not able to process your request",
  "errorDescription": "A server error has occurred",
  "errorDetails": {
    "rawErrorMessage": [
      "500 - \"{\\\"error\\\": {\\\"code\\\": \\\"500\\\", \\\"message\\\": \\\"A server error has occurred\\\"}}\""
    ],
    "httpCode": "500"
  }
}
```

## Recent Improvements (v2.1.0)

The `/api/receive-response` endpoint has been enhanced with:

1. **Better Request Validation**: Validates that the request body is a valid JSON object
2. **Enhanced Logging**: Detailed logs to help diagnose issues
3. **Improved Error Handling**: Distinguishes between timeout, network, and KV errors
4. **Health Check Endpoint**: New `/api/health` endpoint to test KV connectivity

## Step-by-Step Debugging

### Step 1: Check the Health Endpoint

First, verify that your API and KV connection are working:

```bash
curl https://your-app.vercel.app/api/health
```

**Expected Response (Healthy)**:
```json
{
  "success": true,
  "timestamp": "2025-12-01T01:52:45.123Z",
  "service": "Reetaa API",
  "version": "2.1.0",
  "checks": {
    "kv": {
      "success": true,
      "message": "KV connection successful",
      "latency": 234
    }
  },
  "environment": {
    "kvConfigured": true,
    "nodeEnv": "production",
    "region": "iad1"
  }
}
```

**Error Response (KV Not Configured)**:
```json
{
  "success": false,
  "checks": {
    "kv": {
      "success": false,
      "message": "KV not configured. Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables."
    }
  }
}
```

**Error Response (KV Connection Failed)**:
```json
{
  "success": false,
  "checks": {
    "kv": {
      "success": false,
      "message": "KV connection failed: timeout"
    }
  }
}
```

### Step 2: Test the Endpoint Directly

Test the `/api/receive-response` endpoint with curl:

```bash
curl -X POST https://your-app.vercel.app/api/receive-response \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "reply": "Test message"
  }'
```

**Expected Response (Success)**:
```json
{
  "success": true,
  "message": "Message stored successfully"
}
```

### Step 3: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Navigate to your project
3. Click on **Deployments** → Select latest deployment
4. Click on **Functions** tab
5. Find `/api/receive-response` or `/api/health`
6. Click to view logs

Look for these log entries:
- `[receive-response] Request received:` - Shows request details
- `[receive-response] Invalid or missing request body:` - Body validation failed
- `[receive-response] Invalid sessionId:` - SessionId validation failed
- `[receive-response] KV not configured` - Environment variables missing
- `[receive-response] Failed to get KV instance:` - KV connection error
- `[receive-response] Unexpected error:` - Unhandled error

### Step 4: Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables, ensure these are set:

```
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_URL=redis://...
```

If these are missing, you need to:
1. Go to Vercel Dashboard → Storage
2. Create a new KV database (Upstash Redis)
3. **Connect it to your project** (this is critical!)
4. Vercel will automatically add the environment variables
5. Redeploy your project

### Step 5: Check n8n HTTP Request Configuration

Ensure your n8n HTTP Request node is configured correctly:

**Method**: `POST`

**URL**: `https://your-app.vercel.app/api/receive-response`

**Headers**:
- `Content-Type`: `application/json`

**Body**:
```json
{
  "sessionId": "{{ $json.sessionId }}",
  "reply": "{{ $json.reply }}"
}
```

**Common Mistakes**:
- ❌ Missing `Content-Type` header
- ❌ Using URL parameters instead of JSON body
- ❌ Missing `sessionId` or `reply` fields
- ❌ `sessionId` is too short (< 3 characters)
- ❌ `sessionId` contains only special characters

## Common Error Scenarios

### Error 1: "Invalid request body"

**Cause**: The request body is not a valid JSON object

**Solution**:
- Ensure `Content-Type: application/json` header is set
- Verify the body is valid JSON
- Check that n8n is sending the body correctly

**Example Fix**:
```json
// ❌ Wrong - sending as URL parameters
?sessionId=test&reply=hello

// ✅ Correct - sending as JSON body
{
  "sessionId": "test",
  "reply": "hello"
}
```

### Error 2: "Valid sessionId is required"

**Cause**: `sessionId` is missing, empty, or not a string

**Solution**:
- Ensure `sessionId` is included in the request body
- Verify it's a string, not a number or object
- Check that the value is not empty

### Error 3: "Invalid sessionId format"

**Cause**: `sessionId` is too short or contains only special characters

**Solution**:
- Use at least 3 characters
- Include at least one letter or number
- Valid examples: `user123`, `session-abc`, `test_001`
- Invalid examples: `==`, `--`, `ab`

### Error 4: "Service temporarily unavailable"

**Cause**: Vercel KV is not configured or not responding

**Solution**:
1. Check the `/api/health` endpoint
2. Verify KV environment variables are set
3. Ensure KV database is connected to your project
4. Check Vercel KV dashboard for issues

### Error 5: "Storage service timeout"

**Cause**: KV operations are taking too long (> 10 seconds)

**Solution**:
- Check Upstash Redis dashboard for performance issues
- Verify your Vercel region matches your KV region
- Consider upgrading your KV plan if you're hitting rate limits
- Check for network issues between Vercel and Upstash

### Error 6: "Failed to store message"

**Cause**: KV set operation failed

**Solution**:
- Check Vercel function logs for detailed error message
- Verify KV connection with `/api/health` endpoint
- Check KV database quota/limits
- Ensure KV database is not full

## Testing Checklist

- [ ] `/api/health` returns 200 with `"success": true`
- [ ] KV connection test shows `"success": true`
- [ ] Environment variables are set in Vercel
- [ ] KV database is connected to the project
- [ ] curl test to `/api/receive-response` works
- [ ] n8n HTTP Request node has `Content-Type: application/json`
- [ ] n8n sends valid `sessionId` and `reply` fields
- [ ] Vercel function logs show request details

## Example: Full Working n8n HTTP Request

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://your-app.vercel.app/api/receive-response",
    "authentication": "none",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ { \"sessionId\": $json.sessionId, \"reply\": $json.reply } }}",
    "options": {
      "timeout": 10000
    }
  },
  "name": "Send to Vercel API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

## Still Having Issues?

If you're still experiencing 500 errors after following this guide:

1. **Check Vercel Function Logs** - The detailed logs will show the exact error
2. **Test with curl** - Isolate whether it's an n8n issue or API issue
3. **Compare with Working Example** - Use the example configuration above
4. **Check Vercel Status** - Visit [Vercel Status Page](https://www.vercel-status.com/)
5. **Check Upstash Status** - Visit [Upstash Status Page](https://status.upstash.com/)

## Need Help?

When requesting help, please provide:
- Full error message from n8n
- Vercel function logs (from Steps tab)
- Health endpoint response
- n8n HTTP Request node configuration (screenshot or JSON)
- curl test result

---

**Version**: 2.1.0
**Last Updated**: 2025-12-01
