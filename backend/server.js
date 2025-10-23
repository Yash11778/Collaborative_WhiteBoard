const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const path = require('path');

// Load environment variables
dotenv.config();

// Check if we're using an in-memory database
const useInMemory = process.env.IN_MEMORY_DB === 'true';
if (useInMemory) {
  console.log('Using in-memory database as configured in environment variables');
}

// Create Express app
const app = express();

// Enhanced CORS setup to ensure frontend can connect
app.use(cors({
  origin: '*',  // In production, restrict this to your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Middleware for parsing JSON
app.use(express.json());

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log('Request body:', { ...req.body, password: req.body.password ? '[FILTERED]' : undefined });
  }
  next();
});

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Connect to MongoDB if not using in-memory database
if (!useInMemory) {
  console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI?.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://[USERNAME]:[PASSWORD]@'));
  
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('Connection error details:', err.message);
      
      // List possible solutions
      console.log('\nPossible solutions:');
      console.log('1. Make sure MongoDB is installed and running (if using local MongoDB)');
      console.log('2. Check your connection string in .env file');
      console.log('3. If using MongoDB Atlas, verify your network settings allow access');
      console.log('4. Check username and password in your connection string');
      console.log('\nFalling back to in-memory database...');
      
      // Set flag to use in-memory database as fallback
      process.env.IN_MEMORY_DB = 'true';
      useInMemory = true;
      console.log('Using in-memory database (data will not persist!)');
    });
}

// Import models
const Board = require('./models/boardModel');
const Message = require('./models/messageModel');
const User = require('./models/userModel');

// Import routes
const userRoutes = require('./routes/userRoutes');

// API routes
app.use('/api/users', userRoutes);

// Serve static files from the frontend build directory in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../hackathon/dist');
  app.use(express.static(frontendBuildPath));
}

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('/api/boards', async (req, res) => {
  try {
    const boards = await Board.find({});
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/boards', async (req, res) => {
  try {
    const board = await Board.create(req.body);
    res.status(201).json(board);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/boards/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add PATCH endpoint to update board elements
app.patch('/api/boards/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    // Update board properties
    if (req.body.elements) board.elements = req.body.elements;
    if (req.body.name) board.name = req.body.name;
    
    const updatedBoard = await board.save();
    res.json(updatedBoard);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoints for chat messages
app.get('/api/boards/:boardId/messages', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { limit = 50 } = req.query;
    
    const messages = await Message.find({ boardId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .sort({ timestamp: 1 });
      
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route to serve frontend's index.html for client-side routing
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../hackathon/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Socket.io connection handling
const users = {};
const boardAccessCounts = {};  // Track number of users per board

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-board', async (boardId, userData) => {
    socket.join(boardId);
    
    let userInfo = { ...userData };
    
    // If user has a token, get actual user data from database
    if (userData.token) {
      try {
        const decoded = jwt.verify(userData.token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findById(decoded.id);
        if (user) {
          userInfo = {
            id: socket.id,
            userId: user._id,
            name: user.username,
            color: user.color,
          };
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    users[socket.id] = {
      id: socket.id,
      boardId,
      ...userInfo,
      joinedAt: Date.now()
    };
    
    // Update board access counts
    if (!boardAccessCounts[boardId]) {
      boardAccessCounts[boardId] = 0;
    }
    boardAccessCounts[boardId]++;
    
    // Broadcast new user to all other users
    io.to(boardId).emit('user-joined', users[socket.id]);
    
    // Send all current users positions to the new user
    io.to(boardId).emit('cursor-positions', 
      Object.values(users).filter(user => user.boardId === boardId));
    
    // Send active users count
    io.to(boardId).emit('active-users-count', boardAccessCounts[boardId]);
    
    // Load chat history for the user
    try {
      const messages = await Message.find({ boardId })
        .sort({ timestamp: -1 })
        .limit(50)
        .sort({ timestamp: 1 });
        
      socket.emit('chat-history', messages);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  });
  
  // ... rest of socket handlers ...
  socket.on('draw-element', (boardId, element) => {
    socket.to(boardId).emit('element-drawn', element);
  });
  
  socket.on('update-element', (boardId, element) => {
    socket.to(boardId).emit('element-updated', element);
  });
  
  socket.on('delete-element', (boardId, elementId) => {
    socket.to(boardId).emit('element-deleted', elementId);
  });
  
  // Handle grid toggle
  socket.on('grid-toggled', (data) => {
    const { boardId, showGrid } = data;
    socket.to(boardId).emit('grid-toggled', { showGrid });
  });
  
  // Handle zoom changes
  socket.on('zoom-changed', (data) => {
    const { boardId, zoomLevel } = data;
    socket.to(boardId).emit('zoom-changed', { zoomLevel });
  });
  
  // Handle object selection (for visual indicators)
  socket.on('object-selected', (boardId, data) => {
    socket.to(boardId).emit('object-selected', data);
  });
  
  socket.on('object-deselected', (boardId, data) => {
    socket.to(boardId).emit('object-deselected', data);
  });
  
  // Handle tool changes (for awareness)
  socket.on('tool-changed', (boardId, data) => {
    socket.to(boardId).emit('tool-changed', data);
  });
  
  socket.on('cursor-move', (boardId, position) => {
    if (users[socket.id]) {
      users[socket.id].position = position;
      socket.to(boardId).emit('cursor-positions', 
        Object.values(users).filter(user => user.boardId === boardId));
    }
  });
  
  // Handle chat messages
  socket.on('send-message', async (boardId, messageData) => {
    try {
      if (!users[socket.id] || !messageData.text) return;
      
      const sender = users[socket.id];
      
      const message = await Message.create({
        boardId,
        sender: {
          id: sender.id,
          name: sender.name,
          color: sender.color,
        },
        text: messageData.text,
        timestamp: new Date()
      });
      
      const messageToSend = {
        id: message._id || message.id,
        boardId,
        sender: {
          id: sender.id,
          name: sender.name,
          color: sender.color,
        },
        text: message.text,
        timestamp: message.timestamp
      };
      
      io.to(boardId).emit('new-message', messageToSend);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
  
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const boardId = users[socket.id].boardId;
      io.to(boardId).emit('user-left', socket.id);
      
      // Update board access counts
      if (boardAccessCounts[boardId]) {
        boardAccessCounts[boardId]--;
        io.to(boardId).emit('active-users-count', boardAccessCounts[boardId]);
      }
      
      delete users[socket.id];
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Export for Vercel serverless
module.exports = app;
