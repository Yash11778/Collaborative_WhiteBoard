# 🚀 Vercel Deployment Guide

This guide will help you deploy your collaborative whiteboard application on Vercel.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas** - Free cloud MongoDB database at [mongodb.com/atlas](https://www.mongodb.com/atlas)

## 🗂️ Project Structure

```
demo raisoni/
├── backend/          # Backend API & Socket.io server
├── hackathon/        # Frontend React app
└── vercel.json       # Vercel configuration
```

## 📝 Step-by-Step Deployment

### Step 1: Set Up MongoDB Atlas (if not already done)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account and new cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
5. Save this - you'll need it for environment variables

### Step 2: Deploy Backend to Vercel

#### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to backend folder**
   ```bash
   cd backend
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy backend**
   ```bash
   vercel --prod
   ```

5. **Set environment variables** (after first deployment)
   ```bash
   vercel env add MONGODB_URI production
   vercel env add JWT_SECRET production
   vercel env add NODE_ENV production
   ```
   
   When prompted, enter:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Any random secure string (e.g., `your-super-secret-jwt-key-12345`)
   - `NODE_ENV`: `production`

6. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

7. **Note your backend URL** (e.g., `https://your-backend.vercel.app`)

#### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Root Directory**: Set to `backend`
5. **Framework Preset**: Other
6. **Build Command**: Leave empty
7. **Output Directory**: Leave empty
8. Click "Environment Variables" and add:
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Any secure random string
   - `NODE_ENV` = `production`
9. Click "Deploy"
10. **Note your backend URL**

### Step 3: Deploy Frontend to Vercel

#### Option A: Deploy via Vercel CLI

1. **Navigate to frontend folder**
   ```bash
   cd ../hackathon
   ```

2. **Create .env file** (or update if exists)
   ```bash
   echo VITE_SERVER_URL=https://your-backend.vercel.app > .env
   ```
   Replace `https://your-backend.vercel.app` with your actual backend URL from Step 2

3. **Deploy frontend**
   ```bash
   vercel --prod
   ```

4. **Set environment variable**
   ```bash
   vercel env add VITE_SERVER_URL production
   ```
   Enter your backend URL (e.g., `https://your-backend.vercel.app`)

5. **Redeploy**
   ```bash
   vercel --prod
   ```

#### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository (or create a new project)
4. **Root Directory**: Set to `hackathon`
5. **Framework Preset**: Vite
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. Click "Environment Variables" and add:
   - `VITE_SERVER_URL` = Your backend URL (e.g., `https://your-backend.vercel.app`)
9. Click "Deploy"

### Step 4: Update Backend CORS (Important!)

After deploying the frontend, you need to update the backend to allow requests from your frontend domain.

1. Open `backend/server.js`
2. Find the CORS configuration (around line 22):
   ```javascript
   app.use(cors({
     origin: '*',  // In production, restrict this to your frontend domain
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     credentials: true
   }));
   ```

3. Update it to:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'http://localhost:5174',
       'https://your-frontend.vercel.app'  // Replace with your actual frontend URL
     ],
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     credentials: true
   }));
   ```

4. Also update Socket.io CORS (around line 44):
   ```javascript
   const io = new Server(server, {
     cors: {
       origin: [
         'http://localhost:5173',
         'http://localhost:5174',
         'https://your-frontend.vercel.app'  // Replace with your actual frontend URL
       ],
       methods: ['GET', 'POST'],
       credentials: true
     },
   });
   ```

5. Commit and push changes, or redeploy backend

## ✅ Verification

1. Visit your frontend URL: `https://your-app.vercel.app`
2. Create a new board
3. Open the same board in another browser window/tab
4. Test real-time collaboration:
   - Draw shapes
   - Type text
   - Use chat
   - See cursors and presence indicators

## 🔧 Troubleshooting

### Frontend can't connect to backend

**Problem**: Frontend shows "Disconnected" or can't load boards

**Solution**:
1. Check environment variable `VITE_SERVER_URL` is set correctly in Vercel
2. Make sure CORS is configured to allow your frontend domain
3. Check backend logs in Vercel dashboard

### Socket.io not working

**Problem**: Real-time features not working, no cursor tracking

**Solution**:
1. Socket.io may have issues with Vercel's serverless functions
2. Consider using WebSocket-compatible hosting for backend:
   - [Railway.app](https://railway.app) (Recommended for Socket.io)
   - [Render.com](https://render.com)
   - [Fly.io](https://fly.io)

### MongoDB connection failed

**Problem**: Backend errors about database connection

**Solution**:
1. Check `MONGODB_URI` environment variable is set
2. Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Check username/password in connection string are correct

## 🌐 Alternative Deployment (Railway - Better for Socket.io)

If Socket.io doesn't work well on Vercel, use Railway for the backend:

### Deploy Backend on Railway:

1. Go to [railway.app](https://railway.app)
2. Sign up and create new project
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Set **Root Directory** to `backend`
6. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV`
   - `PORT` (Railway will auto-assign)
7. Deploy!
8. Get your Railway backend URL
9. Update frontend `VITE_SERVER_URL` to Railway URL
10. Redeploy frontend on Vercel

Railway provides better support for long-running connections (Socket.io) than Vercel's serverless functions.

## 📱 Custom Domain (Optional)

### Add Custom Domain to Vercel:

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed by Vercel
5. Update `VITE_SERVER_URL` if you add custom domain to backend

## 🎉 Done!

Your collaborative whiteboard is now live! Share the URL with your team and start collaborating in real-time.

### Features Available:
✅ Real-time drawing & editing
✅ Live text editing
✅ Cursor tracking
✅ Real-time chat
✅ Tool change notifications
✅ Grid & zoom sync
✅ User presence indicators
✅ 10+ drawing tools

## 📧 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test MongoDB connection separately

Happy collaborating! 🎨✨
