const Category = require('../models/Category');
const { validationResult } = require('express-validator');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
};

exports.createCategory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const categoryId = await Category.create(req.body);
        res.status(201).json({ 
            id: categoryId, 
            message: 'Category created successfully' 
        });
    } catch (error) {
        console.error('Create category error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: 'Failed to create category' });
    }
};

exports.updateCategory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const updated = await Category.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Update category error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: 'Failed to update category' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const deleted = await Category.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ 
                error: 'Cannot delete category with existing products' 
            });
        }
        res.status(500).json({ error: 'Failed to delete category' });
    }
};