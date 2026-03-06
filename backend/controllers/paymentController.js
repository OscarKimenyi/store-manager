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
        
        // Update purchase payment status if purchase_id is provided
        if (req.body.purchase_id) {
            await Purchase.updatePaymentStatus(req.body.purchase_id);
            
            // Get updated purchase to verify status
            const [updatedPurchase] = await connection.query(
                'SELECT payment_status, total_paid, total_amount FROM purchases WHERE id = ?',
                [req.body.purchase_id]
            );
            
            console.log('Updated purchase status:', updatedPurchase[0]); // Debug log
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
        const paymentId = req.params.id;
        console.log('========== RECEIPT REQUEST ==========');
        console.log('Payment ID from URL params:', paymentId);
        console.log('URL:', req.originalUrl);
        console.log('Params:', req.params);
        
        if (!paymentId) {
            console.log('No payment ID provided');
            return res.status(400).json({ error: 'Payment ID is required' });
        }
        
        // Convert to number and validate
        const id = parseInt(paymentId);
        if (isNaN(id)) {
            console.log('Invalid payment ID format:', paymentId);
            return res.status(400).json({ error: 'Invalid payment ID format' });
        }
        
        console.log('Looking for payment with ID:', id);
        
        const payment = await Payment.findById(id);
        console.log('Payment found:', payment ? 'Yes' : 'No');
        
        if (!payment) {
            console.log('Payment not found with ID:', id);
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        console.log('Payment details:', {
            id: payment.id,
            receipt_path: payment.receipt_path,
            supplier_id: payment.supplier_id
        });
        
        if (!payment.receipt_path) {
            console.log('No receipt path for payment:', id);
            return res.status(404).json({ error: 'No receipt found for this payment' });
        }
        
        const path = require('path');
        const fs = require('fs');
        
        // Get the project root directory
        const projectRoot = path.resolve(__dirname, '../../');
        console.log('Project root:', projectRoot);
        
        // Construct the full path to the receipt file
        let receiptPath;
        
        if (payment.receipt_path.startsWith('frontend/')) {
            receiptPath = path.join(projectRoot, payment.receipt_path);
        } else if (payment.receipt_path.startsWith('../')) {
            receiptPath = path.join(projectRoot, payment.receipt_path.replace('../', ''));
        } else {
            receiptPath = path.join(projectRoot, 'frontend', 'public', 'uploads', 'receipts', path.basename(payment.receipt_path));
        }
        
        receiptPath = path.normalize(receiptPath);
        console.log('Looking for file at:', receiptPath);
        
        if (!fs.existsSync(receiptPath)) {
            console.log('File does not exist at:', receiptPath);
            
            // Try alternative location
            const altPath = path.join(projectRoot, 'frontend', 'public', 'uploads', 'receipts', path.basename(payment.receipt_path));
            console.log('Trying alternative path:', altPath);
            
            if (fs.existsSync(altPath)) {
                receiptPath = altPath;
                console.log('Found file at alternative path');
            } else {
                return res.status(404).json({ error: 'Receipt file not found' });
            }
        }
        
        console.log('File found, sending...');
        
        const ext = path.extname(receiptPath).toLowerCase();
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(receiptPath)}"`);
        
        res.sendFile(receiptPath);
        console.log('========== END RECEIPT REQUEST ==========');
        
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