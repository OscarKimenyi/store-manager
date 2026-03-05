const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const { isAuthenticated } = require('../middleware/auth');

// Validation rules
const supplierValidation = [
    body('name').notEmpty().trim().escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().escape(),
    body('address').optional().trim().escape()
];

// Routes
router.get('/', isAuthenticated, supplierController.getAllSuppliers);
router.get('/:id', isAuthenticated, supplierController.getSupplier);
router.get('/:id/history', isAuthenticated, supplierController.getSupplierHistory);
router.post('/', isAuthenticated, supplierValidation, supplierController.createSupplier);
router.put('/:id', isAuthenticated, supplierValidation, supplierController.updateSupplier);
router.delete('/:id', isAuthenticated, supplierController.deleteSupplier);

module.exports = router;