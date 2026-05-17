const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/authMiddleware');
const { userRegistrationValidation, userUpdateValidation, validate } = require('../utils/validator');

router.post('/register', userRegistrationValidation, validate, UserController.register);

router.put('/update', authenticateToken, userUpdateValidation, validate, UserController.updateProfile);
router.get('/me', authenticateToken, UserController.getMe);

router.get('/email/:email', authenticateToken, UserController.getUserByEmail);
router.get('/id/:id', authenticateToken, UserController.getUserById);

module.exports = router;