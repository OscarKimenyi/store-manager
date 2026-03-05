const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { isAuthenticated } = require('../middleware/auth');

// Validation rules
const productValidation = [
    body('name').notEmpty().trim().escape(),
    body('unit_type').isIn(['Piece', 'Roll', 'Bundle', 'Kg']),
    body('buying_price').isFloat({ min: 0 }),
    body('selling_price').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 0 }),
    body('min_stock_level').isInt({ min: 0 }),
    body('category_id').optional().isInt()
];

// Routes
router.get('/', isAuthenticated, productController.getAllProducts);
router.get('/low-stock', isAuthenticated, productController.getLowStockProducts);
router.get('/:id', isAuthenticated, productController.getProduct);
router.post('/', isAuthenticated, productValidation, productController.createProduct);
router.put('/:id', isAuthenticated, productValidation, productController.updateProduct);
router.delete('/:id', isAuthenticated, productController.deleteProduct);

module.exports = router;