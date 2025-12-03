# PAA Solutions Tool - Setup Guide

## 📋 Overview

This application provides 4 processing modules with embedded AI chat assistance:
1. **Invoice Processing** - Automated invoice handling
2. **KDR Processing** - KDR workflow management
3. **GA Processing** - Analytics and reporting
4. **KDR Invoicing** - Invoice management and tracking

Each module includes an AI-powered chat interface to help users with their tasks.

---

## 🚀 Quick Setup

### 1. Set Up n8n Workflows

You need to create **4 n8n workflows** (one for each module).

#### Import the Template:
1. Download `n8n-simple-module-workflow.json` from this repository
2. Go to your n8n instance → **Workflows** → **Import from File**
3. Import the workflow
4. **Configure the workflow:**
   - Change the **Webhook path** (line 7 in the JSON):
     - For Invoice: `invoice`
     - For KDR: `kdr`
     - For GA: `ga`
     - For KDR Invoicing: `kdr-invoicing`
   - Add your **OpenAI API credentials** (Settings → Credentials → OpenAI API)
5. **Activate** the workflow (toggle to ON)
6. **Copy the webhook URL** (shown in the Webhook node)
7. **Repeat** for all 4 modules

**Result:** You'll have 4 webhook URLs like:
```
https://your-n8n.com/webhook/invoice
https://your-n8n.com/webhook/kdr
https://your-n8n.com/webhook/ga
https://your-n8n.com/webhook/kdr-invoicing
```

---

### 2. Configure Vercel Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

#### Step 1: Delete Any Empty Variables
If these exist with empty values, **DELETE** them first:
- `VITE_N8N_INVOICE_WEBHOOK_URL`
- `VITE_N8N_KDR_WEBHOOK_URL`
- `VITE_N8N_GA_WEBHOOK_URL`
- `VITE_N8N_KDR_INVOICING_WEBHOOK_URL`

#### Step 2: Add Your n8n Webhook URLs

| Variable Name | Value |
|---------------|-------|
| `VITE_N8N_INVOICE_WEBHOOK_URL` | `https://your-n8n.com/webhook/invoice` |
| `VITE_N8N_KDR_WEBHOOK_URL` | `https://your-n8n.com/webhook/kdr` |
| `VITE_N8N_GA_WEBHOOK_URL` | `https://your-n8n.com/webhook/ga` |
| `VITE_N8N_KDR_INVOICING_WEBHOOK_URL` | `https://your-n8n.com/webhook/kdr-invoicing` |

#### Step 3: Add Google Sheets Configuration

| Variable Name | Value |
|---------------|-------|
| `VITE_GOOGLE_SHEET_URL` | Your Google Sheets CSV URL |
| `GOOGLE_SHEET_URL` | Same as above |

**⚠️ Important:** After adding/updating variables, **redeploy** your app in Vercel!

---

### 3. Set Up Google Sheets

Create a Google Sheet with these columns:

| id | username | password | modules |
|----|----------|----------|---------|
| 1 | admin | admin123 | invoice,kdr,ga,kdr invoicing |
| 2 | user1 | pass123 | invoice,kdr |
| 3 | user2 | pass456 | ga,kdr invoicing |

**Publish to web:**
1. File → Share → Publish to web
2. Select: Entire Document + CSV format
3. Copy the published URL
4. Add to Vercel environment variables

---

## ✅ Testing

### 1. Check Console Logs
After deployment, open your app and check browser console (F12):

You should see:
```
🔍 N8N_WEBHOOK_URLS configured: {
  invoice: "https://your-n8n.com/webhook/invoice",
  kdr: "https://your-n8n.com/webhook/kdr",
  ga: "https://your-n8n.com/webhook/ga",
  kdr invoicing: "https://your-n8n.com/webhook/kdr-invoicing"
}
```

### 2. Test Each Module
1. Login to your app
2. Click **Invoice Processing**
3. Send a message in the chat
4. You should see:
   ```
   ✅ Sending to n8n webhook: https://your-n8n.com/webhook/invoice
   ```
5. AI response appears within seconds ✅

Repeat for KDR, GA, and KDR Invoicing modules.

---

## 🔧 Workflow Customization

The n8n workflow has 3 nodes:

```
Webhook → OpenAI → Respond to Webhook
```

### To Add More Functionality:

You can insert additional HTTP nodes between OpenAI and Respond:

```
Webhook → OpenAI → [Your HTTP Node] → [Another HTTP Node] → Respond
```

**Examples of nodes you can add:**
- Database logging (POST to your database API)
- Analytics tracking (POST to analytics service)
- Email notifications (POST to email service)
- Slack/Discord webhooks
- Image generation APIs

**How to add:**
1. Click **"+"** after OpenAI node
2. Select **HTTP Request**
3. Configure your API call
4. Connect to the next node
5. Update the Respond node to include data from your new nodes

---

## 🆘 Troubleshooting

### Issue: "Message received. Processing module not configured"

**Cause:** n8n webhook URLs are not set or are empty

**Fix:**
1. Verify env vars in Vercel are NOT empty
2. Redeploy the app after setting env vars
3. Clear browser cache and refresh

### Issue: No AI response appears

**Causes:**
- n8n workflow not activated
- OpenAI credentials missing
- n8n URL incorrect

**Fix:**
1. Check n8n workflow is **Active** (toggle ON)
2. Verify OpenAI credentials are set
3. Check n8n **Executions** tab for errors
4. Verify webhook URL matches exactly

### Issue: CORS errors in console

**Fix:**
1. n8n webhooks allow all origins by default
2. If you have custom CORS settings, allow your Vercel domain

---

## 📊 Architecture

```
User sends message in module chat
          ↓
Frontend calls n8n webhook with category
          ↓
n8n Webhook receives request
          ↓
OpenAI processes the message
          ↓
n8n responds with AI reply
          ↓
Frontend displays response
```

**Key Features:**
- **Synchronous:** User gets immediate response
- **Simple:** Direct request/response flow
- **Scalable:** Each module has independent workflow
- **Customizable:** Add any HTTP nodes between steps

---

## 📚 Additional Resources

- **n8n Documentation:** https://docs.n8n.io
- **OpenAI API:** https://platform.openai.com/docs
- **Vercel Deployment:** https://vercel.com/docs

---

## 🔐 Security Notes

⚠️ **Important for Production:**
- Hash passwords (currently plain text)
- Use environment-specific secrets
- Enable HTTPS only
- Implement rate limiting
- Add proper authentication tokens
- Use a real database instead of Google Sheets for sensitive data

---

**Built with ❤️ by PAA Solutions**
