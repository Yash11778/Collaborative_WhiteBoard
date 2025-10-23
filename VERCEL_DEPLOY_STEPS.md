# Vercel Deployment - Step by Step Guide

## 🚨 Important: Deploy Frontend and Backend as SEPARATE projects

Vercel works best when frontend and backend are deployed as two separate projects.

## 📋 Step 1: Deploy Backend

### Via Vercel Dashboard:

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository: `Yash11778/Collaborative_WhiteBoard`
4. **IMPORTANT Settings:**
   - Project Name: `collaborative-whiteboard-backend` (or any name)
   - **Root Directory**: Click "Edit" → Select `backend` folder
   - Framework Preset: `Other`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`

5. **Environment Variables** - Click "Add" for each:
   ```
   MONGODB_URI = mongodb+srv://your-connection-string
   JWT_SECRET = your-secret-key-here
   NODE_ENV = production
   PORT = 5000
   ```

6. Click **Deploy**

7. **SAVE YOUR BACKEND URL**: e.g., `https://collaborative-whiteboard-backend.vercel.app`

---

## 📋 Step 2: Deploy Frontend

### Via Vercel Dashboard:

1. Go to https://vercel.com/new **again**
2. Click "Import Project"
3. Select the **SAME** GitHub repository: `Yash11778/Collaborative_WhiteBoard`
4. **IMPORTANT Settings:**
   - Project Name: `collaborative-whiteboard` (or any name)
   - **Root Directory**: Click "Edit" → Select `hackathon` folder
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Environment Variables** - Click "Add":
   ```
   VITE_SERVER_URL = https://your-backend-url.vercel.app
   ```
   (Use the backend URL you saved from Step 1)

6. Click **Deploy**

7. **SAVE YOUR FRONTEND URL**: e.g., `https://collaborative-whiteboard.vercel.app`

---

## 📋 Step 3: Update CORS in Backend

1. Go to your backend project on Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. You can either:
   - Update the code and push to GitHub (Vercel auto-redeploys), OR
   - Keep `origin: '*'` for testing (not recommended for production)

To update code:
1. Edit `backend/server.js` around line 22:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'http://localhost:5174',
       'https://your-frontend.vercel.app'  // Replace with your actual URL
     ],
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     credentials: true
   }));
   ```

2. Also update Socket.io CORS around line 44:
   ```javascript
   const io = new Server(server, {
     cors: {
       origin: [
         'http://localhost:5173',
         'http://localhost:5174',
         'https://your-frontend.vercel.app'  // Replace with your actual URL
       ],
       methods: ['GET', 'POST'],
       credentials: true
     },
   });
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Update CORS for production"
   git push
   ```

Vercel will automatically redeploy!

---

## ✅ Test Your Deployment

1. Visit your frontend URL: `https://your-frontend.vercel.app`
2. Create a new board
3. Draw something
4. Open the same board in another tab
5. Check if real-time collaboration works

---

## 🐛 Troubleshooting

### Frontend shows "Disconnected" or errors:
- Check browser console for errors
- Verify `VITE_SERVER_URL` environment variable is set correctly
- Make sure backend is running (visit `https://your-backend.vercel.app/api/test`)

### Backend shows CORS errors:
- Update CORS configuration in `server.js` with your frontend URL
- Push changes to GitHub

### Real-time features not working:
- Socket.io may not work well on Vercel's serverless functions
- **Solution**: Deploy backend on Railway.app instead:
  1. Go to https://railway.app
  2. New Project → Deploy from GitHub
  3. Select your repo, set root directory to `backend`
  4. Add same environment variables
  5. Get Railway URL and update frontend's `VITE_SERVER_URL`

---

## 🎯 Quick Checklist

- [ ] Backend deployed with correct root directory (`backend`)
- [ ] Backend environment variables set (MONGODB_URI, JWT_SECRET, NODE_ENV)
- [ ] Backend URL saved
- [ ] Frontend deployed with correct root directory (`hackathon`)
- [ ] Frontend environment variable set (VITE_SERVER_URL = backend URL)
- [ ] Frontend URL saved
- [ ] CORS updated in backend with frontend URL
- [ ] Both deployments successful and accessible

---

## 🔗 Your URLs (Fill these in):

- **Backend**: `https://_____________________.vercel.app`
- **Frontend**: `https://_____________________.vercel.app`
- **MongoDB**: `mongodb+srv://___________________`

---

**Need Help?** Check the Vercel deployment logs in your dashboard for specific errors.
