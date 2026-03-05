const db = require('../config/database');

class Product {
    static async findAll(filters = {}) {
        let query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_deleted = false
        `;
        const params = [];
        
        if (filters.category_id) {
            query += ' AND p.category_id = ?';
            params.push(filters.category_id);
        }
        
        if (filters.search) {
            query += ' AND (p.name LIKE ? OR p.size LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        
        query += ' ORDER BY p.created_at DESC';
        
        const [rows] = await db.query(query, params);
        return rows;
    }
    
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? AND p.is_deleted = false',
            [id]
        );
        return rows[0];
    }
    
    static async create(productData) {
        const { name, size, unit_type, buying_price, selling_price, quantity, min_stock_level, category_id } = productData;
        const [result] = await db.query(
            'INSERT INTO products (name, size, unit_type, buying_price, selling_price, quantity, min_stock_level, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, size, unit_type, buying_price, selling_price, quantity, min_stock_level, category_id]
        );
        return result.insertId;
    }
    
    static async update(id, productData) {
        const { name, size, unit_type, buying_price, selling_price, quantity, min_stock_level, category_id } = productData;
        const [result] = await db.query(
            'UPDATE products SET name = ?, size = ?, unit_type = ?, buying_price = ?, selling_price = ?, quantity = ?, min_stock_level = ?, category_id = ? WHERE id = ? AND is_deleted = false',
            [name, size, unit_type, buying_price, selling_price, quantity, min_stock_level, category_id, id]
        );
        return result.affectedRows > 0;
    }
    
    static async delete(id) {
        const [result] = await db.query(
            'UPDATE products SET is_deleted = true WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
    
    static async updateQuantity(id, quantity, operation = 'add') {
        const operator = operation === 'add' ? '+' : '-';
        const [result] = await db.query(
            `UPDATE products SET quantity = quantity ${operator} ? WHERE id = ? AND is_deleted = false`,
            [quantity, id]
        );
        return result.affectedRows > 0;
    }
    
    static async getLowStock() {
        const [rows] = await db.query(
            'SELECT * FROM products WHERE quantity <= min_stock_level AND is_deleted = false ORDER BY quantity ASC'
        );
        return rows;
    }
}

module.exports = Product;