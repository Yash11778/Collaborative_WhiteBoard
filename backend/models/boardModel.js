const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['line', 'rectangle', 'circle', 'text', 'path']
  },
  properties: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
