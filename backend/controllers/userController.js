const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET not set. Using fallback secret. This is not secure for production.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, color } = req.body;
    console.log(`Processing registration for ${username} (${email})`);

    // Input validation
    if (!username || !email || !password) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({ message: 'Please provide username, email and password' });
    }

    if (password.length < 6) {
      console.log('Registration failed: Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('Registration failed: Email already exists');
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Check if username is taken
    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      console.log('Registration failed: Username already taken');
      return res.status(400).json({ message: 'Username is already taken' });
    }

    console.log('Creating user in database...');
    
    // Create user
    const user = await User.create({
      username,
      email,
      password,
      color: color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);
      console.log('Registration successful for user:', user._id);

      // Return user data without password
      const userData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        color: user.color,
      };

      res.status(201).json({
        user: userData,
        token,
      });
    } else {
      console.log('Registration failed: User not created');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Processing login for ${email}`);

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Login failed: Incorrect password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful for user:', user._id);

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      color: user.color,
    };

    res.json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Return user data without password
      const userData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        color: user.color,
      };
      
      res.json(userData);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
