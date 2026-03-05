const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { isAuthenticated } = require('../middleware/auth');

// Validation rules
const categoryValidation = [
    body('name').notEmpty().trim().escape(),
    body('description').optional().trim().escape()
];

// Routes
router.get('/', isAuthenticated, categoryController.getAllCategories);
router.get('/:id', isAuthenticated, categoryController.getCategory);
router.post('/', isAuthenticated, categoryValidation, categoryController.createCategory);
router.put('/:id', isAuthenticated, categoryValidation, categoryController.updateCategory);
router.delete('/:id', isAuthenticated, categoryController.deleteCategory);

module.exports = router;