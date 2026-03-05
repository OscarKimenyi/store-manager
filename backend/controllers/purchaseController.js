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
        return res.status(400).json({ errors: errors.array() });
    }
    
    const connection = await require('../config/database').getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Create purchase
        const purchaseId = await Purchase.create(req.body);
        
        // Update product quantity
        await Product.updateQuantity(
            req.body.product_id, 
            req.body.quantity, 
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
        res.status(500).json({ error: 'Failed to create purchase' });
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