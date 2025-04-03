const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Check if we're using an in-memory database
const useInMemory = process.env.IN_MEMORY_DB === 'true';

// Setup in-memory users collection if needed
let inMemoryUsers = [];
let User;

if (useInMemory) {
  // In-memory implementation
  console.log('Using in-memory User model');
  
  // Mock User model for in-memory storage
  User = {
    findOne: async function({ email, username } = {}) {
      if (email) {
        return inMemoryUsers.find(user => user.email === email);
      }
      if (username) {
        return inMemoryUsers.find(user => user.username === username);
      }
      return null;
    },
    
    findById: async function(id) {
      return inMemoryUsers.find(user => user._id === id);
    },
    
    create: async function(userData) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create new user object
      const newUser = {
        _id: `user_${Date.now()}`,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        color: userData.color || `#${Math.floor(Math.random()*16777215).toString(16)}`,
        createdAt: new Date(),
        
        // Add methods to match mongoose model
        matchPassword: async function(enteredPassword) {
          return bcrypt.compare(enteredPassword, this.password);
        }
      };
      
      // Store in memory
      inMemoryUsers.push(newUser);
      return newUser;
    }
  };
  
  // Add a demo user
  User.create({
    username: 'demo',
    email: 'demo@example.com',
    password: 'password',
    color: '#FF5733'
  });
  
} else {
  // MongoDB implementation
  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    color: {
      type: String,
      default: function() {
        return `#${Math.floor(Math.random()*16777215).toString(16)}`;
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Hash password before saving
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Method to compare passwords
  userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  // Create the model
  User = mongoose.model('User', userSchema);
}

module.exports = User;
