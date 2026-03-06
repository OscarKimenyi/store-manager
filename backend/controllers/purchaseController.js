const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

exports.getAllPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.findAll(req.query);
        res.json(purchases);
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
};

exports.getPurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.json(purchase);
    } catch (error) {
        console.error('Get purchase error:', error);
        res.status(500).json({ error: 'Failed to fetch purchase' });
    }
};

exports.createPurchase = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    
    const connection = await require('../config/database').getConnection();
    
    try {
        await connection.beginTransaction();
        
        console.log('Creating purchase with data:', req.body); // Debug log
        
        // Validate required fields
        if (!req.body.product_id || !req.body.supplier_id || !req.body.quantity || !req.body.unit_price || !req.body.purchase_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Create purchase
        const purchaseData = {
            product_id: parseInt(req.body.product_id),
            supplier_id: parseInt(req.body.supplier_id),
            quantity: parseInt(req.body.quantity),
            unit_price: parseFloat(req.body.unit_price),
            purchase_date: req.body.purchase_date,
            payment_status: req.body.payment_status || 'Unpaid',
            notes: req.body.notes || ''
        };
        
        console.log('Processed purchase data:', purchaseData);
        
        const purchaseId = await Purchase.create(purchaseData);
        console.log('Purchase created with ID:', purchaseId);
        
        // Update product quantity
        await Product.updateQuantity(
            purchaseData.product_id, 
            purchaseData.quantity, 
            'add'
        );
        
        await connection.commit();
        
        res.status(201).json({ 
            id: purchaseId, 
            message: 'Purchase created successfully' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create purchase error:', error);
        res.status(500).json({ error: 'Failed to create purchase: ' + error.message });
    } finally {
        connection.release();
    }
};

exports.updatePurchase = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const updated = await Purchase.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.json({ message: 'Purchase updated successfully' });
    } catch (error) {
        console.error('Update purchase error:', error);
        res.status(500).json({ error: 'Failed to update purchase' });
    }
};

exports.deletePurchase = async (req, res) => {
    try {
        const deleted = await Purchase.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        console.error('Delete purchase error:', error);
        res.status(500).json({ error: 'Failed to delete purchase' });
    }
};

exports.getPurchasesByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const purchases = await Purchase.findByDateRange(startDate, endDate);
        res.json(purchases);
    } catch (error) {
        console.error('Get purchases by date error:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
};