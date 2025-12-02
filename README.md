# PAA Solutions Tool

A modern web application for Invoice Processing, KDR Processing, and GA Processing with Google Sheets integration and real-time chat functionality.

## Features

- 🔐 **Secure Authentication** - Login system backed by Google Sheets database
- 📊 **Invoice Processing** - Automated invoice handling and processing
- 📦 **KDR Processing** - Efficient KDR workflow management
- 📈 **GA Processing** - Analytics and reporting automation
- 🧾 **KDR Invoicing** - KDR invoice management and tracking
- 🔒 **Module-Based Access Control** - Per-user permissions for different modules
- 💬 **AI Chat with n8n** - Multiple asynchronous AI responses using n8n workflows and polling
- ☁️ **Cloud Database** - Google Sheets integration for data storage
- 🎨 **Modern UI** - Beautiful gradient design with animated components

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Data Source**: Google Sheets (published CSV)
- **Deployment**: Vercel
- **Automation**: n8n (for chat workflows)
- **Chat Architecture**: Polling-based (Vercel compatible)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Sheet set up with your data
- A Vercel account (free tier works)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd reetaa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your Google Sheets URL:
   ```env
   VITE_GOOGLE_SHEET_URL=your-google-sheet-csv-url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Google Sheets Setup

To use Google Sheets as your database:

1. **Create a Google Sheet** with the following structure for users:

   **Required Columns:**
   | id | username | password | modules |
   |----|----------|----------|---------|
   | 1  | admin    | admin123 | invoice,kdr,ga,kdr invoicing |
   | 2  | user1    | pass123  | invoice,kdr |
   | 3  | user2    | pass456  | ga,kdr invoicing |

   **Optional Columns:**
   | role | email |
   |------|-------|
   | admin| admin@example.com |
   | user | user1@example.com |
   | user | user2@example.com |

   **Important Notes:**
   - `id`: Unique identifier for each user
   - `username`: Login username (case-insensitive)
   - `password`: Plain-text password (⚠️ use hashing in production)
   - `modules`: Comma-separated list of modules the user can access
     - Available modules: `invoice`, `kdr`, `ga`, `kdr invoicing`
     - Example: `"invoice,kdr,ga"` gives access to 3 modules
     - Example: `"kdr invoicing"` gives access to only KDR Invoicing
   - `role` (optional): User role for additional metadata
   - `email` (optional): User email address

2. **Publish the sheet to the web**:
   - Go to **File** → **Share** → **Publish to web**
   - Select **Entire Document**
   - Choose **Comma-separated values (.csv)** format
   - Click **Publish**
   - Copy the generated URL

3. **Add the URL to your environment variables**:
   - Update `VITE_GOOGLE_SHEET_URL` in your `.env` file
   - For Vercel deployment, add it to your Vercel project settings

### Module Access Control

The application implements module-based access control:

- **Authorized Modules**: Users can click and access modules listed in their `modules` column
- **Unauthorized Modules**: Appear blurred/disabled with a "No Access" badge
- **No Errors**: Clicking unauthorized modules does nothing (no error messages shown)
- **Dynamic**: Access is checked on login and persisted in localStorage

### 💬 Chat Feature with n8n

The application includes a powerful AI chat interface that supports **multiple asynchronous responses** from n8n workflows.

#### Features
- **Multiple Async Responses**: n8n sends 2, 3, or more responses for a single message
- **Polling-based**: Compatible with Vercel (no WebSocket/SSE required)
- **Stateless**: No server-side chat storage - everything in localStorage
- **Privacy**: Each user isolated by unique sessionId
- **Real-time Updates**: Frontend polls every 1 second for new messages

#### Quick Setup

1. **Set up Redis Storage (REQUIRED)**:
   - Go to Vercel dashboard → Storage → Create Database
   - Choose **Upstash Redis** (recommended) or **KV** (legacy)
   - Connect the database to your project
   - See [VERCEL_KV_SETUP.md](./VERCEL_KV_SETUP.md) for detailed instructions
   - **⚠️ Without Redis storage, the webhook feature will NOT work!**

2. **Add chat module** to user's modules in Google Sheets:
   ```csv
   id,username,password,modules
   1,admin,admin123,"chat,invoice,kdr,ga"
   ```

3. **Set up n8n workflow**:
   - Import `n8n-chat-workflow.json` into n8n
   - Update the Vercel API URL in the workflow
   - Activate the workflow
   - Copy the webhook URL

4. **Configure frontend**:
   ```bash
   # Add to .env
   VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/chat
   ```

   Or set in browser console:
   ```javascript
   localStorage.setItem('n8nWebhookUrl', 'your-webhook-url');
   ```

#### Documentation

- 🔴 **[VERCEL_KV_SETUP.md](./VERCEL_KV_SETUP.md)** - **REQUIRED: Redis storage setup (Upstash/KV - must do first!)**
- 📘 **[N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md)** - Complete n8n workflow setup
- 📗 **[CHAT_FEATURE.md](./CHAT_FEATURE.md)** - Architecture and customization
- 📙 **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing and debugging

#### Architecture

```
User → Frontend → n8n Webhook
                     ↓
              [Multiple HTTP POSTs]
                     ↓
         Vercel /api/receive-response
                     ↓
            In-Memory Storage
                     ↓
     Frontend polls /api/get-updates
```

See [CHAT_FEATURE.md](./CHAT_FEATURE.md) for detailed architecture diagrams.

## Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deployment

1. **Install Vercel CLI** (optional)
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

   Or push to your Git repository and connect it to Vercel.

### Environment Variables on Vercel

After deploying, add the following environment variables in your Vercel project settings:

1. Go to your project on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add **BOTH** of the following variables (use the same URL for both):

   | Name | Value | Purpose |
   |------|-------|---------|
   | `VITE_GOOGLE_SHEET_URL` | Your Google Sheets published CSV URL | Frontend (build time) |
   | `GOOGLE_SHEET_URL` | Your Google Sheets published CSV URL | Backend API (runtime) |
   | `VITE_N8N_WEBHOOK_URL` | Your n8n webhook URL (optional) | Chat feature |

   **Example URL format:**
   ```
   https://docs.google.com/spreadsheets/d/e/2PACX-xxxxx/pub?output=csv
   ```

4. Click **Save** and **redeploy** your project (redeploy is required for environment variables to take effect)

## Project Structure

```
reetaa/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ChatInterface.tsx    # 💬 Chat component
│   │   ├── InvoiceProcessing.tsx
│   │   ├── KDRProcessing.tsx
│   │   ├── GAProcessing.tsx
│   │   ├── KDRInvoicing.tsx
│   │   └── ui/             # UI components (shadcn)
│   ├── services/           # Services
│   │   └── api.ts          # Google Sheets client
│   ├── types/              # TypeScript types
│   │   └── api.ts          # Data types
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── api/                    # Vercel serverless functions
│   ├── auth.ts            # Authentication API
│   ├── receive-response.ts # 💬 n8n callback endpoint
│   └── get-updates.ts     # 💬 Frontend polling endpoint
├── .env.example            # Environment variables template
├── vercel.json             # Vercel configuration
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies
├── N8N_SETUP_GUIDE.md     # 💬 n8n workflow setup guide
├── CHAT_FEATURE.md        # 💬 Chat architecture docs
├── TESTING_GUIDE.md       # 💬 Testing instructions
└── n8n-chat-workflow.json # 💬 n8n workflow template

```

## How It Works

The application fetches data directly from a published Google Sheets CSV URL:

1. **Authentication**:
   - User credentials are validated against the Google Sheet
   - Fetches CSV data from the published URL
   - Parses user data and validates username/password
   - Returns user object with module permissions

2. **Data Access**:
   - All data is fetched directly from Google Sheets
   - No backend API required
   - Simple CSV parsing using PapaParse
   - Real-time data updates when sheet is modified

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## Configuration

### Vercel Configuration

The `vercel.json` file contains:
- Build settings (output directory, framework)
- SPA routing configuration

### Vite Configuration

The `vite.config.ts` includes:
- React plugin with SWC
- Path aliases
- Build optimizations
- Development server settings

## Customization

### Update Branding

To customize the branding:

1. Update logo in `src/assets/`
2. Modify colors in component files (search for hex colors like `#4A90F5`, `#C74AFF`)
3. Update application name in environment variables
4. Change footer signature in `Dashboard.tsx` and `LoginPage.tsx`

### Add New Processing Modules

1. Create a new component in `src/components/`
2. Add route in `src/App.tsx`
3. Add card in `Dashboard.tsx`
4. Update API endpoints if needed

## Security Notes

⚠️ **Important**: The current authentication implementation is basic and suitable for internal tools. For production use:

- Implement proper password hashing (bcrypt, argon2)
- Use HTTPS for all communications
- Add JWT token validation
- Implement rate limiting
- Use environment-specific secrets
- Consider using a proper database instead of Google Sheets for sensitive data

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install`
- Verify Node.js version: `node -v` (should be 18+)
- Clear cache: `rm -rf node_modules dist && npm install`

### Authentication Not Working
- Verify Google Sheets URL is correct and publicly accessible
- Check that the sheet has the correct column headers: `id`, `username`, `password`, `modules`
- Ensure the `modules` column contains comma-separated module names (e.g., "invoice,kdr")
- Verify environment variables are set correctly in both `.env` and Vercel settings
- Check browser console for detailed error messages

### API Routes Not Working on Vercel
- Verify `vercel.json` is properly configured
- Check Vercel function logs in the dashboard
- Ensure environment variables are set in Vercel project settings

## Support

For issues and questions:
- Check the [Issues](https://github.com/your-repo/issues) page
- Visit [PAA Solutions](https://www.paa-solutions.com)

## License

[Your License Here]

---

**Built with ❤️ by PAA Solutions**
