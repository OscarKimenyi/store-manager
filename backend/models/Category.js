const db = require('../config/database');

class Category {
    static async findAll() {
        const [rows] = await db.query(
            'SELECT * FROM categories WHERE is_deleted = false ORDER BY name ASC'
        );
        return rows;
    }
    
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM categories WHERE id = ? AND is_deleted = false',
            [id]
        );
        return rows[0];
    }
    
    static async create(categoryData) {
        const { name, description } = categoryData;
        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        return result.insertId;
    }
    
    static async update(id, categoryData) {
        const { name, description } = categoryData;
        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ? AND is_deleted = false',
            [name, description, id]
        );
        return result.affectedRows > 0;
    }
    
    static async delete(id) {
        const [result] = await db.query(
            'UPDATE categories SET is_deleted = true WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
    
    static async getProductCount(id) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_deleted = false',
            [id]
        );
        return rows[0].count;
    }
}

module.exports = Category;