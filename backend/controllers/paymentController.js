const Payment = require('../models/Payment');
const Purchase = require('../models/Purchase');
const { validationResult } = require('express-validator');

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll(req.query);
        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

exports.getPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
};

exports.createPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const connection = await require('../config/database').getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Handle file upload
        const receiptPath = req.file ? req.file.path.replace(/\\/g, '/') : null;
        
        // Create payment
        const paymentData = {
            ...req.body,
            receipt_path: receiptPath
        };
        
        const paymentId = await Payment.create(paymentData);
        
        // Update purchase payment status
        if (req.body.purchase_id) {
            await Purchase.updatePaymentStatus(req.body.purchase_id);
        }
        
        await connection.commit();
        
        res.status(201).json({ 
            id: paymentId, 
            message: 'Payment recorded successfully' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    } finally {
        connection.release();
    }
};

exports.getPaymentReceipt = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment || !payment.receipt_path) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        
        const path = require('path');
        const fs = require('fs');
        const receiptPath = path.resolve(payment.receipt_path);
        
        if (!fs.existsSync(receiptPath)) {
            return res.status(404).json({ error: 'Receipt file not found' });
        }
        
        res.sendFile(receiptPath);
    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ error: 'Failed to fetch receipt' });
    }
};

exports.getSupplierPayments = async (req, res) => {
    try {
        const payments = await Payment.findBySupplier(req.params.supplierId);
        res.json(payments);
    } catch (error) {
        console.error('Get supplier payments error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier payments' });
    }
};