const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });  // Don't create _id for sub-documents

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  elements: [elementSchema],
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
  this.updatedAt = Date.now();
  next();
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
