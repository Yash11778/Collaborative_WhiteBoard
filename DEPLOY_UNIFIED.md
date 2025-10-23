# 🚀 Deploy Full Stack App Together on Vercel

## One-Click Deployment

Deploy both frontend and backend together as a single Vercel project.

### Step 1: Push to GitHub

Make sure all changes are committed and pushed:
```bash
git add .
git commit -m "Configure for unified Vercel deployment"
git push
```

### Step 2: Deploy on Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository: `Yash11778/Collaborative_WhiteBoard`
4. **Settings:**
   - **Root Directory**: `.` (leave as root)
   - **Framework Preset**: Other
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Environment Variables** - Add these:
   ```
   MONGODB_URI = your_mongodb_connection_string
   JWT_SECRET = your-secret-key-123
   NODE_ENV = production
   ```

6. Click **Deploy**

#### Option B: Via Vercel CLI

```bash
vercel login
vercel
```

When prompted:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- Project name? `collaborative-whiteboard`
- Directory? `.` (root)

**Add environment variables:**
```bash
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add NODE_ENV production
```

**Redeploy:**
```bash
vercel --prod
```

### Step 3: Done! 🎉

Your app is now deployed at: `https://your-app.vercel.app`

Both frontend and backend are served from the same URL:
- Frontend: `https://your-app.vercel.app/`
- API: `https://your-app.vercel.app/api/...`
- Socket.io: `https://your-app.vercel.app/socket.io/...`

---

## How It Works

The deployment:
1. Builds the React frontend → `hackathon/dist/`
2. Deploys the Express backend → serves API routes
3. Backend serves the frontend static files in production
4. Everything runs from the same domain (no CORS issues!)

---

## Environment Variables Needed

### Required:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Set to `production`

### Optional:
- `PORT` - Vercel handles this automatically

---

## Testing Your Deployment

1. Visit your deployment URL
2. Create a new board
3. Draw something
4. Open the same board in another tab
5. Test real-time collaboration

---

## Troubleshooting

### Build fails
- Check build logs in Vercel dashboard
- Verify `package.json` scripts are correct
- Make sure `hackathon/dist` is created during build

### Can't connect to MongoDB
- Verify `MONGODB_URI` environment variable
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- Verify username/password in connection string

### Real-time features not working
- Socket.io may have issues on Vercel serverless
- Alternative: Deploy on Railway.app for better WebSocket support

### API returns 404
- Make sure routes in `vercel.json` are correct
- Check that `/api/*` routes are before the catch-all route

---

## Files Modified for Unified Deployment

- ✅ `package.json` (root) - Build scripts
- ✅ `vercel.json` (root) - Routing configuration
- ✅ `backend/server.js` - Serves frontend in production
- ✅ Frontend stores - Use relative URLs in production

All ready! Just push and deploy! 🚀
