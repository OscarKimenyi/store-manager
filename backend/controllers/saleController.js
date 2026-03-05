const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

exports.getAllSales = async (req, res) => {
    try {
        const sales = await Sale.findAll(req.query);
        res.json(sales);
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

exports.getSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }
        res.json(sale);
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Failed to fetch sale' });
    }
};

exports.createSale = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const connection = await require('../config/database').getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check stock availability
        const product = await Product.findById(req.body.product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (product.quantity < req.body.quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock',
                available: product.quantity 
            });
        }
        
        // Create sale
        const saleId = await Sale.create(req.body);
        
        // Update product quantity
        await Product.updateQuantity(
            req.body.product_id, 
            req.body.quantity, 
            'subtract'
        );
        
        await connection.commit();
        
        res.status(201).json({ 
            id: saleId, 
            message: 'Sale recorded successfully' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Failed to record sale' });
    } finally {
        connection.release();
    }
};

exports.getDailySales = async (req, res) => {
    try {
        const { date } = req.query;
        const sales = await Sale.getDailySales(date || new Date().toISOString().split('T')[0]);
        res.json(sales);
    } catch (error) {
        console.error('Get daily sales error:', error);
        res.status(500).json({ error: 'Failed to fetch daily sales' });
    }
};

exports.getMonthlySales = async (req, res) => {
    try {
        const { year, month } = req.query;
        const sales = await Sale.getMonthlySales(year, month);
        res.json(sales);
    } catch (error) {
        console.error('Get monthly sales error:', error);
        res.status(500).json({ error: 'Failed to fetch monthly sales' });
    }
};