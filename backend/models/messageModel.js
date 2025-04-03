const mongoose = require('mongoose');

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

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
