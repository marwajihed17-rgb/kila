# Deployment Guide for Vercel

This guide will walk you through deploying the PAA Solutions Tool to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. ✅ A Vercel account (sign up at https://vercel.com)
2. ✅ A Google Sheet with your data published as CSV
3. ✅ Git repository with your code (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Google Sheet

### Create Your Sheet

1. Create a new Google Sheet or use an existing one
2. Set up the first sheet with user credentials:

   ```
   | username | password | role  | email                 |
   |----------|----------|-------|-----------------------|
   | admin    | admin123 | admin | admin@example.com     |
   | user1    | pass123  | user  | user1@example.com     |
   ```

### Publish the Sheet

1. Open your Google Sheet
2. Click **File** → **Share** → **Publish to web**
3. In the dialog:
   - Select **Entire Document** (or specific sheet)
   - Choose **Comma-separated values (.csv)** format
   - Click **Publish**
4. **Copy the generated URL** - you'll need this for Vercel

Example URL format:
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vR.../pub?output=csv
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click **Import Git Repository**
   - Select your repository
   - Click **Import**

3. **Configure Build Settings**

   Vercel should auto-detect the settings, but verify:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**

   Before clicking "Deploy", add these environment variables:

   | Name | Value | Purpose |
   |------|-------|---------|
   | `VITE_GOOGLE_SHEET_URL` | Your Google Sheets CSV URL | Frontend (build time) |
   | `GOOGLE_SHEET_URL` | Your Google Sheets CSV URL | Backend API (runtime) |
   | `VITE_API_BASE_URL` | `/api` | API base path |
   | `VITE_APP_NAME` | `PAA Solutions Tool` | App name |
   | `VITE_APP_URL` | `https://www.paa-solutions.com` | App URL |

   **⚠️ IMPORTANT**: You must set **BOTH** `VITE_GOOGLE_SHEET_URL` and `GOOGLE_SHEET_URL` with the same URL value. The frontend uses `VITE_GOOGLE_SHEET_URL` and the backend API uses `GOOGLE_SHEET_URL`.

5. **Click "Deploy"**

   Wait for the deployment to complete (usually 1-2 minutes)

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   # Frontend environment variable (build time)
   vercel env add VITE_GOOGLE_SHEET_URL
   # Paste your Google Sheets URL when prompted

   # Backend environment variable (runtime)
   vercel env add GOOGLE_SHEET_URL
   # Paste your Google Sheets URL when prompted (same URL as above)

   vercel env add VITE_API_BASE_URL
   # Enter: /api

   vercel env add VITE_APP_NAME
   # Enter: PAA Solutions Tool

   vercel env add VITE_APP_URL
   # Enter: https://www.paa-solutions.com
   ```

   **Note**: Both `VITE_GOOGLE_SHEET_URL` and `GOOGLE_SHEET_URL` should have the same value.

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 3: Verify Deployment

1. **Visit Your Site**

   Vercel will provide a URL like: `https://your-project.vercel.app`

2. **Test Login**

   Try logging in with credentials from your Google Sheet:
   - Username: `admin`
   - Password: `admin123`

3. **Test API Endpoints**

   Open browser console and check:
   ```javascript
   // Test sheets endpoint
   fetch('/api/sheets').then(r => r.json()).then(console.log)
   ```

4. **Check Logs**

   If something doesn't work:
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on any function to see logs
   - Check for errors

## Step 4: Configure Custom Domain (Optional)

1. **Go to Project Settings**
   - Vercel Dashboard → Your Project → Settings → Domains

2. **Add Domain**
   - Enter your domain (e.g., `app.paa-solutions.com`)
   - Follow DNS configuration instructions

3. **Update Environment Variables**
   - Update `VITE_APP_URL` to your custom domain

## Troubleshooting

### Build Fails

**Error**: `vite: not found`
- **Fix**: Ensure `package.json` has all dependencies
- Run: `npm install` locally to verify

**Error**: `Module not found`
- **Fix**: Check import paths in your code
- Ensure all files are committed to Git

### API Routes Not Working

**Error**: `404 on /api/auth`
- **Fix**: Verify `vercel.json` is in root directory
- Check that `api` folder is committed to Git
- Redeploy the project

**Error**: `CORS errors`
- **Fix**: Already handled in API routes
- Check browser console for specific errors

### Authentication Fails

**Error**: `Invalid credentials`
- **Fix**: Verify Google Sheets URL in environment variables
- Test the CSV URL directly in browser
- Ensure sheet is published to web (not just shared)

**Error**: `Failed to fetch sheet`
- **Fix**: Make sure sheet is published as CSV
- Check if Google Sheets URL is accessible
- Verify URL format is correct

### Environment Variables Not Working

**Error**: `undefined` values in app
- **Fix**: Environment variables must start with `VITE_` for frontend
- Server-side variables (API routes) don't need `VITE_` prefix
- Redeploy after adding environment variables

## Post-Deployment

### Monitor Your Application

1. **Check Analytics**
   - Vercel Dashboard → Analytics
   - Monitor page views, performance

2. **Review Function Logs**
   - Vercel Dashboard → Functions
   - Check for errors or slow responses

3. **Set Up Alerts**
   - Vercel Dashboard → Settings → Notifications
   - Configure email alerts for failures

### Security Best Practices

1. **Update Passwords**
   - Change default passwords in Google Sheets
   - Use strong, unique passwords

2. **Enable HTTPS**
   - Vercel provides SSL by default
   - Verify all requests use HTTPS

3. **Review Access**
   - Limit who has access to Vercel project
   - Restrict Google Sheets edit permissions

4. **Implement Rate Limiting**
   - Consider adding rate limiting to API routes
   - Use Vercel Edge Config for advanced features

## Continuous Deployment

Once set up, deployments are automatic:

1. **Commit changes**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Vercel auto-deploys**
   - Every push to `main` triggers deployment
   - Preview deployments for other branches

3. **Monitor deployment**
   - Check Vercel Dashboard for deployment status
   - Test the new deployment

## Support

If you encounter issues:

1. Check Vercel Documentation: https://vercel.com/docs
2. Review Vercel Community: https://github.com/vercel/vercel/discussions
3. Check project issues: [Your GitHub Issues URL]

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Ready to Deploy?** Follow the steps above and your application will be live in minutes! 🚀
