# 🚀 Quick Deploy to Vercel

## Prerequisites
- GitHub repository with your code
- Vercel account ([sign up free](https://vercel.com))
- MongoDB Atlas account ([sign up free](https://mongodb.com/atlas))

## ⚡ Quick Start (Via Vercel Dashboard - Recommended)

### 1️⃣ Deploy Backend First

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory**: `backend`
4. **Framework Preset**: Other
5. **Build Command**: Leave empty
6. **Output Directory**: Leave empty
7. **Install Command**: `npm install`
8. Add **Environment Variables**:
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Any secure random string (e.g., `my-super-secret-jwt-key-123`)
   - `NODE_ENV` = `production`
9. Click **Deploy**
10. **📋 Copy your backend URL** (e.g., `https://your-backend.vercel.app`)

### 2️⃣ Deploy Frontend

1. Go to [vercel.com/new](https://vercel.com/new) again
2. Import the **same GitHub repository**
3. **Root Directory**: `hackathon`
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Install Command**: `npm install`
8. Add **Environment Variable**:
   - `VITE_SERVER_URL` = Your backend URL from step 1
9. Click **Deploy**

### 3️⃣ Update CORS

Edit `backend/server.js` around line 22 and 44:

**Before:**
```javascript
origin: '*'
```

**After:**
```javascript
origin: ['https://your-frontend.vercel.app', 'http://localhost:5173']
```

Replace `your-frontend.vercel.app` with your actual frontend URL.

Commit and push to GitHub - Vercel will auto-redeploy!

---

## ⚡ Alternative: Deploy via CLI

### 1️⃣ Install Vercel CLI
```bash
npm install -g vercel
```

### 2️⃣ Deploy Backend
```bash
cd backend
vercel login
vercel --prod
```

**Add environment variables:**
```bash
vercel env add MONGODB_URI production
# Paste your MongoDB connection string

vercel env add JWT_SECRET production
# Enter: my-super-secret-jwt-key-123

vercel env add NODE_ENV production
# Enter: production

vercel --prod
```

**📋 Copy your backend URL** (e.g., `https://backend-abc123.vercel.app`)

### 3️⃣ Deploy Frontend
```bash
cd ../hackathon
vercel --prod
```

**Add environment variable:**
```bash
vercel env add VITE_SERVER_URL production
# Paste your backend URL from step 2

vercel --prod
```

### 4️⃣ Update CORS

Edit `backend/server.js` line 22 and 44, replace `origin: '*'` with:
```javascript
origin: ['https://your-frontend.vercel.app']
```

Redeploy backend:
```bash
cd ../backend
vercel --prod
```

## ✅ Done!

Visit your frontend URL and test:
- ✅ Create a board
- ✅ Draw shapes
- ✅ Open in another tab
- ✅ See real-time sync!

## ⚠️ Socket.io Note

If real-time features don't work on Vercel (Socket.io limitation with serverless), deploy backend on:
- **Railway.app** (Recommended)
- **Render.com**
- **Fly.io**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🆘 Troubleshooting

**Frontend shows "Disconnected"**
- Check `VITE_SERVER_URL` environment variable
- Verify CORS allows your frontend domain

**Real-time not working**
- Socket.io may need dedicated hosting (use Railway)
- Check browser console for WebSocket errors

**Can't connect to MongoDB**
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas network access (allow 0.0.0.0/0)

## 📖 Full Guide

For detailed deployment instructions, alternative hosting options, and troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md).
