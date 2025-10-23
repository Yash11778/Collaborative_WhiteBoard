# 🔍 Fixing 404 NOT_FOUND Error on Vercel

## Why You're Getting 404 Error

The 404 error means you're trying to access a deployment that doesn't exist. This usually happens because:

1. ❌ **Wrong approach**: Trying to deploy the entire monorepo as one project
2. ❌ **Incorrect root directory**: Vercel can't find the files to deploy
3. ❌ **Build failed**: The deployment didn't complete successfully

## ✅ Correct Solution: Deploy Separately

Your project has TWO separate applications:
- **Backend** (in `/backend` folder) - Node.js + Express + Socket.io
- **Frontend** (in `/hackathon` folder) - React + Vite

**You MUST deploy them as TWO SEPARATE projects on Vercel!**

---

## 🚀 How to Deploy (The Right Way)

### Step 1: Delete Any Existing Failed Deployments

1. Go to your Vercel dashboard
2. If you have any failed projects, delete them
3. Start fresh

### Step 2: Deploy Backend FIRST

```bash
cd backend
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- Project name? `collab-backend` (or any name)
- Directory? `.` (current directory, you're already in backend folder)

**Add environment variables:**
```bash
vercel env add MONGODB_URI production
# Enter your MongoDB connection string

vercel env add JWT_SECRET production
# Enter: my-super-secret-key-123

vercel env add NODE_ENV production
# Enter: production
```

**Redeploy with env vars:**
```bash
vercel --prod
```

**📋 Copy your backend URL!** Example: `https://collab-backend.vercel.app`

### Step 3: Deploy Frontend

```bash
cd ../hackathon
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- Project name? `collab-whiteboard` (or any name)
- Directory? `.` (current directory, you're already in hackathon folder)

**Add environment variable:**
```bash
vercel env add VITE_SERVER_URL production
# Enter your backend URL from Step 2
```

**Redeploy with env var:**
```bash
vercel --prod
```

**📋 Copy your frontend URL!** Example: `https://collab-whiteboard.vercel.app`

---

## 🎯 Alternative: Use Vercel Dashboard

### For Backend:
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Root Directory**: `backend` ← IMPORTANT!
4. Framework: Other
5. Add env vars
6. Deploy

### For Frontend:
1. Go to https://vercel.com/new (again)
2. Import the SAME GitHub repo
3. **Root Directory**: `hackathon` ← IMPORTANT!
4. Framework: Vite
5. Add env var: `VITE_SERVER_URL`
6. Deploy

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **Don't deploy from root directory**
   - Always set root directory to `backend` or `hackathon`

2. ❌ **Don't try to deploy both together**
   - Vercel expects ONE application per project
   - Deploy backend and frontend as separate projects

3. ❌ **Don't forget environment variables**
   - Backend needs: MONGODB_URI, JWT_SECRET, NODE_ENV
   - Frontend needs: VITE_SERVER_URL

4. ❌ **Don't forget to update CORS**
   - After deploying, update `backend/server.js` with your frontend URL

---

## 🧪 Test Your Deployment

After both are deployed:

1. Test backend: Visit `https://your-backend.vercel.app/api/test`
   - Should see: `{"message": "API is working"}`

2. Test frontend: Visit `https://your-frontend.vercel.app`
   - Should load the application

3. Test collaboration:
   - Create a board
   - Open in two tabs
   - Draw in one tab
   - Should appear in the other tab instantly

---

## 🆘 Still Getting Errors?

### Check Vercel Logs:
1. Go to your project dashboard
2. Click on the deployment
3. Click "Build Logs" or "Function Logs"
4. Look for specific errors

### Common Issues:

**"Module not found"**
- Run `npm install` in the correct directory
- Make sure `package.json` exists

**"Build failed"**
- Check if `npm run build` works locally
- Verify build command in Vercel settings

**"Cannot connect to backend"**
- Verify `VITE_SERVER_URL` is set correctly
- Check CORS configuration in backend

---

## 🎉 Success!

Once both are deployed and working:
- Backend at: `https://your-backend.vercel.app`
- Frontend at: `https://your-frontend.vercel.app`
- Share the frontend URL with your team!

**Note**: If Socket.io real-time features don't work on Vercel, deploy backend on Railway.app instead (it's free and better for WebSocket connections).
