const mongoose = require('mongoose');

// Check if we're using an in-memory database
const useInMemory = process.env.IN_MEMORY_DB === 'true';

// Setup in-memory boards collection if needed
let inMemoryBoards = [];
let Board;

if (useInMemory) {
  // In-memory implementation
  console.log('Using in-memory Board model');
  
  // Add a demo board
  inMemoryBoards.push({
    _id: 'demo-board-123',
    name: 'Demo Board',
    elements: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Mock Board model for in-memory storage
  Board = {
    find: async function() {
      return inMemoryBoards;
    },
    
    findById: async function(id) {
      const board = inMemoryBoards.find(b => b._id === id);
      
      // If board exists, add save method to it
      if (board) {
        board.save = async function() {
          // Update updatedAt timestamp
          this.updatedAt = new Date();
          
          // Find and update the board in the array
          const index = inMemoryBoards.findIndex(b => b._id === this._id);
          if (index !== -1) {
            inMemoryBoards[index] = this;
          }
          
          return this;
        };
      }
      
      return board;
    },
    
    create: async function(data) {
      const newBoard = {
        _id: `board_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: data.name || 'Untitled Board',
        elements: data.elements || [],
        messages: data.messages || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function() {
          this.updatedAt = new Date();
          return this;
        }
      };
      
      inMemoryBoards.push(newBoard);
      return newBoard;
    }
  };
  
} else {
  // MongoDB implementation
  const boardSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Board'
    },
    elements: {
      type: Array,
      default: []
    },
    messages: {
      type: Array,
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  boardSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });

  // Create the model
  Board = mongoose.model('Board', boardSchema);
}

module.exports = Board;
