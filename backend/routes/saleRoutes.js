const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const saleController = require('../controllers/saleController');
const { isAuthenticated } = require('../middleware/auth');

// Validation rules
const saleValidation = [
    body('product_id').isInt(),
    body('quantity').isInt({ min: 1 }),
    body('selling_price').isFloat({ min: 0 }),
    body('sale_date').isDate(),
    body('payment_method').isIn(['Cash', 'Card', 'Bank Transfer'])
];

// Routes
router.get('/', isAuthenticated, saleController.getAllSales);
router.get('/daily', isAuthenticated, saleController.getDailySales);
router.get('/monthly', isAuthenticated, saleController.getMonthlySales);
router.get('/:id', isAuthenticated, saleController.getSale);
router.post('/', isAuthenticated, saleValidation, saleController.createSale);

module.exports = router;