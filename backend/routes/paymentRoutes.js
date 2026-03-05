const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation rules
const paymentValidation = [
    body('supplier_id').isInt(),
    body('amount_paid').isFloat({ min: 0.01 }),
    body('payment_date').isDate(),
    body('payment_method').isIn(['Cash', 'Bank', 'Mobile Money'])
];

// Routes
router.get('/', isAuthenticated, paymentController.getAllPayments);
router.get('/supplier/:supplierId', isAuthenticated, paymentController.getSupplierPayments);
router.get('/:id', isAuthenticated, paymentController.getPayment);
router.get('/:id/receipt', isAuthenticated, paymentController.getPaymentReceipt);
router.post('/', 
    isAuthenticated, 
    upload.single('receipt'),
    paymentValidation, 
    paymentController.createPayment
);

module.exports = router;