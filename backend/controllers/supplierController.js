const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { validationResult } = require('express-validator');

exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll(req.query);
        res.json(suppliers);
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
};

exports.getSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(supplier);
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier' });
    }
};

exports.createSupplier = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const supplierId = await Supplier.create(req.body);
        res.status(201).json({ 
            id: supplierId, 
            message: 'Supplier created successfully' 
        });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
};

exports.updateSupplier = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const updated = await Supplier.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json({ message: 'Supplier updated successfully' });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const deleted = await Supplier.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
};

exports.getSupplierHistory = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        
        const purchases = await Purchase.findBySupplier(req.params.id);
        
        // Get payments for this supplier
        const db = require('../config/database');
        const [payments] = await db.query(
            `SELECT sp.*, p.purchase_date 
             FROM supplier_payments sp
             LEFT JOIN purchases p ON sp.purchase_id = p.id
             WHERE sp.supplier_id = ?
             ORDER BY sp.payment_date DESC`,
            [req.params.id]
        );
        
        res.json({
            supplier,
            purchases: purchases || [],
            payments: payments || [],
            totalPurchases: (purchases || []).reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0),
            totalPaid: (payments || []).reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0)
        });
    } catch (error) {
        console.error('Get supplier history error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier history' });
    }
};