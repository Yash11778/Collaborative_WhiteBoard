const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Test route to check if user routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'User routes are working' });
});

router.post('/register', (req, res, next) => {
  console.log('Registration request received:', { ...req.body, password: '[FILTERED]' });
  registerUser(req, res).catch(next);
});

router.post('/login', (req, res, next) => {
  console.log('Login request received:', { ...req.body, password: '[FILTERED]' });
  loginUser(req, res).catch(next);
});

router.get('/profile', protect, (req, res, next) => {
  getUserProfile(req, res).catch(next);
});

module.exports = router;
