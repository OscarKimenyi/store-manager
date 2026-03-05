const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Validation rules
const loginValidation = [
    body('username').notEmpty().trim().escape(),
    body('password').notEmpty()
];

const registerValidation = [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
];

// Routes - Make sure all handlers are functions
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);
router.get('/logout', authController.logout);
router.get('/me', isAuthenticated, authController.getCurrentUser);

module.exports = router;