# Redis Storage Setup Guide for Webhook Feature

## 🎯 Overview

The webhook feature (n8n chat integration) requires **Redis storage** to work properly. This is necessary because Vercel serverless functions don't share memory between different API endpoints.

## ⚠️ Important: Vercel KV → Upstash Transition

Vercel is transitioning from Vercel KV to direct **Upstash integration**. Both options work with this application:

- **Option 1: Upstash (Recommended)** - Direct Upstash Redis integration
- **Option 2: Vercel KV (Legacy)** - Existing Vercel KV (powered by Upstash)

The code works with both since they use the same `@vercel/kv` SDK. Choose the option that appears in your Vercel dashboard.

## ❌ Why the Webhook Wasn't Working

The previous implementation used in-memory `Map` objects to store messages. However:

1. **Separate Memory Spaces**: `/api/receive-response` and `/api/get-updates` are separate serverless functions
2. **No Shared State**: Each function has its own memory that isn't shared
3. **Messages Lost**: When n8n sent messages to `/receive-response`, they were stored in one Map. When the frontend polled `/get-updates`, it read from a completely different empty Map

**Result**: Messages were never delivered to the frontend.

## ✅ The Fix: Vercel KV

Vercel KV is a managed Redis service that provides persistent storage shared across all serverless functions.

## 🔧 Setup Instructions

### Option 1: Upstash Integration (Recommended)

If you see "Upstash Redis" in your Vercel Storage options:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** or **Browse Marketplace**
4. Select **Upstash** integration
5. Click **Add Integration**
6. Choose a name (e.g., `reetaa-chat-redis`)
7. Select the region closest to your users
8. Click **Create Database**

### Option 2: Vercel KV (Legacy)

If you see "KV" in your Vercel Storage options:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **KV** (Key-Value Store)
5. Choose a name (e.g., `reetaa-chat-kv`)
6. Select the region closest to your users
7. Click **Create**

### Step 2: Connect to Your Project

1. After creating the database, click **Connect Project**
2. Select your project from the list
3. Choose the environment(s) to connect:
   - ✅ Production
   - ✅ Preview (optional)
   - ✅ Development (optional)
4. Click **Connect**

This automatically adds the required environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL` (or `UPSTASH_REDIS_REST_URL` for Upstash)

### Step 3: Install Dependencies (Already Done)

The `@vercel/kv` package has already been added to `package.json`. If you need to reinstall:

```bash
npm install @vercel/kv
```

### Step 4: Deploy

After connecting KV to your project:

```bash
git push origin claude/fix-webhook-startup-01G3dHmZih3QwH9GTEWVBBm6
```

Vercel will automatically deploy with the KV connection.

### Step 5: Test the Webhook

1. Open your deployed app
2. Navigate to the chat interface
3. Send a test message to your n8n webhook
4. You should now see responses appearing in the chat!

## 📊 How It Works Now

```
User → Frontend → n8n Webhook
                     ↓
              [Process Message]
                     ↓
          HTTP POST → /api/receive-response
                     ↓
              Vercel KV (Redis)
              ┌─────────────┐
              │ chat:abc123 │ ← sessionId
              │ [messages]  │
              └─────────────┘
                     ↑
          HTTP GET ← /api/get-updates
                     ↓
                  Frontend
```

### Changes Made

**`api/receive-response.ts`**:
- ❌ Removed: `Map<string, ChatMessage[]>()` (in-memory)
- ❌ Removed: `setInterval` cleanup timer
- ✅ Added: `kv.get()` and `kv.set()` to store messages in Redis
- ✅ Added: Automatic TTL (5 minutes) on stored messages

**`api/get-updates.ts`**:
- ❌ Removed: `Map<string, ChatMessage[]>()` (in-memory)
- ✅ Added: `kv.get()` to retrieve messages from Redis
- ✅ Added: `kv.del()` to clear messages after retrieval

## 🔍 Verifying It's Working

### Check Vercel KV Dashboard

1. Go to **Storage** → **Your KV Database**
2. Click **Data Browser**
3. You should see keys like:
   - `chat:abc123`
   - `chat:xyz789`
4. These keys auto-expire after 5 minutes

### Check Vercel Function Logs

1. Go to **Deployments** → **Your Latest Deployment**
2. Click **Functions** tab
3. Look for logs from:
   - `/api/receive-response` - Should show "Stored message for session..."
   - `/api/get-updates` - Should show "Retrieved and cleared X messages..."

## 💰 Pricing

### Upstash Free Tier
- ✅ **256 MB storage**
- ✅ **10,000 commands/day**
- ✅ More than enough for moderate chat usage!

### Vercel KV Free Tier (Legacy)
- ✅ **256 MB storage**
- ✅ **30,000 commands/month**

For typical chat usage (assuming 100 users/day with 10 messages each):
- **Storage**: ~1 KB per message × 1,000 messages = ~1 MB (well under limits)
- **Commands**: ~3,000 commands/day

**Both free tiers work well for development and small-to-medium production use.**

If you need more capacity:
- **Upstash Pay-as-you-go**: Starting at $0.2 per 100K commands
- **Vercel KV Pro** (legacy): $20/month for unlimited commands

## 🐛 Troubleshooting

### Error: "KV_REST_API_URL is not defined"

**Solution**: You haven't connected Redis storage to your project yet.
1. Go to Vercel dashboard
2. Storage → (Upstash or KV) → Connect Project
3. Redeploy your app

### Messages still not appearing

**Check**:
1. ✅ Redis storage (Upstash or Vercel KV) is connected to your project
2. ✅ Environment variables are set (check Vercel dashboard → Settings → Environment Variables)
3. ✅ Latest code is deployed (check git push and Vercel deployment)
4. ✅ n8n webhook is sending to the correct URL (should be `https://your-app.vercel.app/api/receive-response`)

### Local Development

For local development, you'll need to pull the environment variables:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Pull environment variables
vercel env pull .env.local
```

This creates a `.env.local` file with your KV credentials.

## 📚 Additional Resources

- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [Vercel + Upstash Integration](https://vercel.com/integrations/upstash)
- [Vercel KV Documentation (Legacy)](https://vercel.com/docs/storage/vercel-kv)
- [@vercel/kv SDK Reference](https://vercel.com/docs/storage/vercel-kv/kv-reference)

## 🎉 Summary

✅ **Before**: In-memory storage (didn't work in serverless)
✅ **After**: Redis (Upstash or Vercel KV) for persistent, shared storage
✅ **Result**: Webhooks now work correctly!
✅ **Compatibility**: Works with both Upstash and Vercel KV using the same code

---

**Need Help?** Check the [Upstash Documentation](https://upstash.com/docs/redis) or [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv), or open an issue.
