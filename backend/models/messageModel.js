const mongoose = require('mongoose');

// Check if we're using an in-memory database
const useInMemory = process.env.IN_MEMORY_DB === 'true';

// Setup in-memory messages collection if needed
let inMemoryMessages = [];
let Message;

if (useInMemory) {
  // In-memory implementation
  console.log('Using in-memory Message model');
  
  // Mock Message model for in-memory storage
  Message = {
    find: async function({ boardId } = {}) {
      if (boardId) {
        const messages = inMemoryMessages.filter(m => m.boardId === boardId);
        
        // Support for sort and limit methods chain
        return {
          sort: function() {
            // Simple sort method - returns self for chaining
            return this;
          },
          limit: function() {
            // Simple limit method - returns self for chaining
            return this;
          },
          then: function(callback) {
            // Promise-like behavior to support async/await
            return Promise.resolve(messages).then(callback);
          }
        };
      }
      return Promise.resolve([]);
    },
    
    create: async function(data) {
      const newMessage = {
        _id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        boardId: data.boardId,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp || new Date()
      };
      
      inMemoryMessages.push(newMessage);
      return newMessage;
    }
  };
  
} else {
  // MongoDB implementation
  const messageSchema = new mongoose.Schema({
    boardId: {
      type: String,
      required: true,
      index: true
    },
    sender: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      color: {
        type: String,
        required: true
      }
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  });

  // Create indices for efficient retrieval
  messageSchema.index({ boardId: 1, timestamp: 1 });

  // Create the model
  Message = mongoose.model('Message', messageSchema);
}

module.exports = Message;
