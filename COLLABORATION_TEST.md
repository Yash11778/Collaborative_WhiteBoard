# 🧪 Live Collaboration Testing Guide

## ✅ How to Test Real-Time Collaboration

### **Setup:**
1. Open **TWO browser windows/tabs** side by side
2. Go to the same board in both: `http://localhost:5173/board/[BOARD_ID]`
3. Look for **green "Connected"** indicator in top-left

---

## 🎨 **Drawing Collaboration Test**

### **Test 1: Basic Drawing**
1. **Window 1**: Select Pen tool (P)
2. **Window 1**: Draw something
3. **Window 2**: Should see the drawing appear INSTANTLY ✅

### **Test 2: Shape Drawing**
1. **Window 1**: Select Rectangle tool (R)
2. **Window 1**: Draw a rectangle
3. **Window 2**: Should see rectangle appear immediately ✅

### **Test 3: Moving Objects**
1. **Window 1**: Select tool (V), move an object
2. **Window 2**: Should see object move in real-time ✅

### **Test 4: Deleting Objects**
1. **Window 1**: Select object, press Delete
2. **Window 2**: Object should disappear ✅

---

## 🔍 **View Collaboration Test**

### **Test 5: Grid Toggle**
1. **Window 1**: Click Grid button (Ctrl+G)
2. **Window 2**: Grid should appear/disappear ✅

### **Test 6: Zoom Sync**
1. **Window 1**: Zoom in (Ctrl++)
2. **Window 2**: Zoom level should sync ✅

---

## 💬 **Chat Collaboration Test**

### **Test 7: Real-Time Chat**
1. **Window 1**: Click blue chat button (right side)
2. **Window 1**: Type message and send
3. **Window 2**: Message should appear instantly ✅
4. **Window 2**: Should hear notification sound ✅

---

## 👥 **User Presence Test**

### **Test 8: Cursor Tracking**
1. **Window 1**: Move mouse on canvas
2. **Window 2**: Should see colored cursor with name ✅

### **Test 9: Active User Count**
1. **Both Windows**: Check top-right user count
2. Should show "2 users online" ✅

---

## 🔍 **Debug Console Logs**

Open **Browser DevTools (F12)** → **Console** tab

### **Expected Logs When Drawing:**

**Window 1 (Drawing):**
```
🎨 Emitting draw-element: [ELEMENT_ID]
```

**Window 2 (Receiving):**
```
📥 Received element-drawn: [ELEMENT_ID]
```

### **Expected Logs When Moving:**

**Window 1 (Moving):**
```
✏️ Emitting update-element: [ELEMENT_ID]
```

**Window 2 (Receiving):**
```
📥 Received element-updated: [ELEMENT_ID]
```

---

## 🚨 **Troubleshooting**

### **Problem: "Disconnected" or "Connecting..." Status**

**Solution 1: Check Backend**
```powershell
# In terminal, check if backend is running
cd "d:\HACKATHONS\demo raisoni\backend"
npm run dev
```
Expected: `Server running on port 5000`

**Solution 2: Check Socket URL**
1. Open DevTools → Network tab
2. Look for WebSocket connection
3. Should see: `ws://localhost:5000/socket.io/...`

**Solution 3: Restart Both Servers**
```powershell
# Stop both servers (Ctrl+C)
# Restart backend
cd "d:\HACKATHONS\demo raisoni\backend"
npm run dev

# Restart frontend (new terminal)
cd "d:\HACKATHONS\demo raisoni\hackathon"
npm run dev
```

### **Problem: Drawing Not Syncing**

**Check Console Logs:**
1. Open DevTools (F12)
2. Draw something
3. Look for 🎨 emoji log
4. If missing, socket is not connected

**Verify Socket:**
```javascript
// In browser console, type:
window.socket
// Should show: Socket object with connected: true
```

### **Problem: Grid/Zoom Not Syncing**

**Check:**
1. Both windows show "Connected" status
2. Console shows grid-toggled/zoom-changed events
3. Backend running without errors

---

## ✅ **Success Checklist**

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Green "Connected" indicator visible
- [ ] Two browser windows open to same board
- [ ] Active user count shows "2"
- [ ] Console logs show 🎨 and 📥 emojis
- [ ] Drawing syncs instantly
- [ ] Moving objects syncs
- [ ] Grid toggle syncs
- [ ] Zoom changes sync
- [ ] Chat messages sync
- [ ] Cursors visible for both users

---

## 🎯 **Live Features**

### **Currently Working:**
✅ Real-time drawing  
✅ Real-time object updates  
✅ Real-time deletion  
✅ Grid synchronization  
✅ Zoom synchronization  
✅ Chat messaging  
✅ Cursor tracking  
✅ User presence  
✅ Active user count  

### **Connection Status:**
- 🟢 **Green dot** = Live collaboration active
- 🟡 **Yellow dot** = Connecting...
- 🔴 **Red dot** = Disconnected

---

## 📊 **Performance Check**

1. Open **CanvasInfo panel** (bottom-right)
2. Check **FPS counter**
3. Should be **50+ FPS** (green) ✅
4. If lower, reduce number of objects

---

## 🎉 **Expected Behavior**

When everything works:
1. ⚡ **Instant sync** - No delay
2. 👀 **Visual feedback** - See others' cursors
3. 💬 **Chat works** - Messages appear instantly
4. 🔔 **Notifications** - Sound when message received
5. 🎨 **All tools sync** - Draw, move, delete, style
6. 📐 **View syncs** - Grid, zoom match across users

---

## 💡 **Tips**

1. **Use unique colors** - Each user has different cursor color
2. **Watch console** - Emojis show what's happening
3. **Check status** - Green = good, Red = problem
4. **Test one feature at a time** - Easier to debug
5. **Clear canvas** - If too many objects, performance drops

---

**Collaboration is LIVE! Test karke dekho! 🚀✨**
