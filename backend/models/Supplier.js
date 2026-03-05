const db = require('../config/database');

class Supplier {
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM suppliers WHERE is_deleted = false';
        const params = [];
        
        if (filters.search) {
            query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }
        
        query += ' ORDER BY name ASC';
        
        const [rows] = await db.query(query, params);
        return rows;
    }
    
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM suppliers WHERE id = ? AND is_deleted = false',
            [id]
        );
        return rows[0];
    }
    
    static async create(supplierData) {
        const { name, phone, email, address } = supplierData;
        const [result] = await db.query(
            'INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)',
            [name, phone, email, address]
        );
        return result.insertId;
    }
    
    static async update(id, supplierData) {
        const { name, phone, email, address } = supplierData;
        const [result] = await db.query(
            'UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ? AND is_deleted = false',
            [name, phone, email, address, id]
        );
        return result.affectedRows > 0;
    }
    
    static async delete(id) {
        const [result] = await db.query(
            'UPDATE suppliers SET is_deleted = true WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
    
    static async getPurchaseTotal(id) {
        const [rows] = await db.query(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE supplier_id = ?',
            [id]
        );
        return rows[0].total;
    }
    
    static async getPaymentTotal(id) {
        const [rows] = await db.query(
            'SELECT COALESCE(SUM(amount_paid), 0) as total FROM supplier_payments WHERE supplier_id = ?',
            [id]
        );
        return rows[0].total;
    }
}

module.exports = Supplier;