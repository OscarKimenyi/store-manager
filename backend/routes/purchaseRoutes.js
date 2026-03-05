const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const purchaseController = require('../controllers/purchaseController');
const { isAuthenticated } = require('../middleware/auth');

// Validation rules
const purchaseValidation = [
    body('product_id').isInt(),
    body('supplier_id').isInt(),
    body('quantity').isInt({ min: 1 }),
    body('unit_price').isFloat({ min: 0 }),
    body('purchase_date').isDate(),
    body('payment_status').isIn(['Paid', 'Partial', 'Unpaid'])
];

// Routes
router.get('/', isAuthenticated, purchaseController.getAllPurchases);
router.get('/range', isAuthenticated, purchaseController.getPurchasesByDateRange);
router.get('/:id', isAuthenticated, purchaseController.getPurchase);
router.post('/', isAuthenticated, purchaseValidation, purchaseController.createPurchase);
router.put('/:id', isAuthenticated, purchaseValidation, purchaseController.updatePurchase);
router.delete('/:id', isAuthenticated, purchaseController.deletePurchase);

module.exports = router;