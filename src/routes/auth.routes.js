const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;