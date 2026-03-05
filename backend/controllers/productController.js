const Product = require('../models/Product');
const { validationResult } = require('express-validator');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll(req.query);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createProduct = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const productId = await Product.create(req.body);
        res.status(201).json({ id: productId, message: 'Product created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProduct = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const updated = await Product.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.getLowStock();
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};