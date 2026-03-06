const db = require('../config/database');

class Purchase {
    static async findAll(filters = {}) {
        let query = `
            SELECT p.*, pr.name as product_name, s.name as supplier_name 
            FROM purchases p
            JOIN products pr ON p.product_id = pr.id
            JOIN suppliers s ON p.supplier_id = s.id
            WHERE pr.is_deleted = false AND s.is_deleted = false
        `;
        const params = [];
        
        if (filters.supplier_id) {
            query += ' AND p.supplier_id = ?';
            params.push(filters.supplier_id);
        }
        
        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(p.purchase_date) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }
        
        if (filters.payment_status) {
            query += ' AND p.payment_status = ?';
            params.push(filters.payment_status);
        }
        
        if (filters.limit) {
            query += ' ORDER BY p.created_at DESC LIMIT ?';
            params.push(parseInt(filters.limit));
        } else {
            query += ' ORDER BY p.created_at DESC';
        }
        
        const [rows] = await db.query(query, params);
        return rows;
    }
    
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT p.*, pr.name as product_name, pr.unit_type, s.name as supplier_name, s.phone as supplier_phone 
             FROM purchases p
             JOIN products pr ON p.product_id = pr.id
             JOIN suppliers s ON p.supplier_id = s.id
             WHERE p.id = ?`,
            [id]
        );
        return rows[0];
    }
    
    static async create(purchaseData) {
        const { product_id, supplier_id, quantity, unit_price, purchase_date, payment_status, notes } = purchaseData;
        
        // Calculate total amount for reference only, but don't insert it
        const total_amount = quantity * unit_price;
        
        console.log('Purchase.create with data:', {
            product_id, supplier_id, quantity, unit_price, 
            total_amount, purchase_date, payment_status, notes
        });
        
        // IMPORTANT FIX: Remove total_amount and balance from the INSERT
        // These are GENERATED columns in the database
        const [result] = await db.query(
            `INSERT INTO purchases 
             (product_id, supplier_id, quantity, unit_price, purchase_date, payment_status, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [product_id, supplier_id, quantity, unit_price, purchase_date, payment_status || 'Unpaid', notes]
        );
        
        console.log('Purchase insert result:', result);
        return result.insertId;
    }
    
    static async update(id, purchaseData) {
        const { quantity, unit_price, purchase_date, payment_status, notes } = purchaseData;
        const total_amount = quantity * unit_price;
        
        const [result] = await db.query(
            `UPDATE purchases 
             SET quantity = ?, unit_price = ?, total_amount = ?, purchase_date = ?, payment_status = ?, notes = ? 
             WHERE id = ?`,
            [quantity, unit_price, total_amount, purchase_date, payment_status, notes, id]
        );
        return result.affectedRows > 0;
    }
    
    static async delete(id) {
        const [result] = await db.query('DELETE FROM purchases WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    
    static async findBySupplier(supplierId) {
        const [rows] = await db.query(
            `SELECT p.*, pr.name as product_name, pr.unit_type 
             FROM purchases p
             JOIN products pr ON p.product_id = pr.id
             WHERE p.supplier_id = ? AND pr.is_deleted = false
             ORDER BY p.purchase_date DESC`,
            [supplierId]
        );
        return rows;
    }
    
    static async findByDateRange(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT p.*, pr.name as product_name, s.name as supplier_name 
             FROM purchases p
             JOIN products pr ON p.product_id = pr.id
             JOIN suppliers s ON p.supplier_id = s.id
             WHERE DATE(p.purchase_date) BETWEEN ? AND ?
             ORDER BY p.purchase_date DESC`,
            [startDate, endDate]
        );
        return rows;
    }
    
    static async updatePaymentStatus(purchaseId) {
        // Calculate total paid from payments
        const [payments] = await db.query(
            'SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM supplier_payments WHERE purchase_id = ?',
            [purchaseId]
        );
        
        const totalPaid = payments[0].total_paid;
        
        // Get purchase total
        const [purchase] = await db.query(
            'SELECT total_amount FROM purchases WHERE id = ?',
            [purchaseId]
        );
        
        if (purchase.length === 0) return false;
        
        const totalAmount = purchase[0].total_amount;
        let paymentStatus = 'Unpaid';
        
        if (totalPaid >= totalAmount) {
            paymentStatus = 'Paid';
        } else if (totalPaid > 0) {
            paymentStatus = 'Partial';
        }
        
        // Update purchase
        const [result] = await db.query(
            'UPDATE purchases SET total_paid = ?, payment_status = ? WHERE id = ?',
            [totalPaid, paymentStatus, purchaseId]
        );
        
        return result.affectedRows > 0;
    }
}

module.exports = Purchase;