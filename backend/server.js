const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // This will accept connections from any origin
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models
const Board = require('./models/boardModel');
const Message = require('./models/messageModel');

// API routes
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
    const board = new Board(req.body);
    await board.save();
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
    
    await board.save();
    res.json(board);
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

// Socket.io connection handling
const users = {};
const boardAccessCounts = {};  // Track number of users per board

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-board', (boardId, userData) => {
    socket.join(boardId);
    users[socket.id] = {
      id: socket.id,
      boardId,
      ...userData,
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
    Message.find({ boardId })
      .sort({ timestamp: -1 })
      .limit(50)
      .sort({ timestamp: 1 })
      .then(messages => {
        socket.emit('chat-history', messages);
      })
      .catch(err => {
        console.error('Error fetching chat history:', err);
      });
  });
  
  socket.on('draw-element', (boardId, element) => {
    socket.to(boardId).emit('element-drawn', element);
  });
  
  socket.on('update-element', (boardId, element) => {
    socket.to(boardId).emit('element-updated', element);
  });
  
  socket.on('delete-element', (boardId, elementId) => {
    socket.to(boardId).emit('element-deleted', elementId);
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
      
      const message = new Message({
        boardId,
        sender: {
          id: sender.id,
          name: sender.name,
          color: sender.color,
        },
        text: messageData.text,
        timestamp: new Date()
      });
      
      await message.save();
      
      const messageToSend = {
        id: message._id,
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
});
