const db = require('../config/database');

class Payment {
    static async findAll(filters = {}) {
        let query = `
            SELECT sp.*, s.name as supplier_name, p.purchase_date
            FROM supplier_payments sp
            JOIN suppliers s ON sp.supplier_id = s.id
            LEFT JOIN purchases p ON sp.purchase_id = p.id
            WHERE s.is_deleted = false
        `;
        const params = [];
        
        if (filters.supplier_id) {
            query += ' AND sp.supplier_id = ?';
            params.push(filters.supplier_id);
        }
        
        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(sp.payment_date) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }
        
        query += ' ORDER BY sp.payment_date DESC';
        
        const [rows] = await db.query(query, params);
        return rows;
    }
    
    static async findById(id) {
        console.log('Payment.findById called with id:', id); // Debug log
        
        const [rows] = await db.query(
            `SELECT sp.*, s.name as supplier_name, s.phone, p.purchase_date, p.total_amount 
             FROM supplier_payments sp
             JOIN suppliers s ON sp.supplier_id = s.id
             LEFT JOIN purchases p ON sp.purchase_id = p.id
             WHERE sp.id = ?`,
            [id]
        );
        
        console.log('Query result rows:', rows.length); // Debug log
        
        return rows[0];
    }
    
    static async create(paymentData) {
        const { supplier_id, purchase_id, amount_paid, payment_date, payment_method, receipt_path, notes } = paymentData;
        
        let normalizedPath = receipt_path;
        if (receipt_path) {
            const path = require('path');
            const projectRoot = path.resolve(__dirname, '../../');
            
            if (receipt_path.startsWith(projectRoot)) {
                normalizedPath = path.relative(projectRoot, receipt_path);
            } else {
                normalizedPath = receipt_path;
            }
            
            normalizedPath = normalizedPath.replace(/\\/g, '/');
            
            if (!normalizedPath.startsWith('frontend/') && !normalizedPath.startsWith('../')) {
                normalizedPath = path.join('frontend', 'public', 'uploads', 'receipts', path.basename(receipt_path)).replace(/\\/g, '/');
            }
        }
        
        const [result] = await db.query(
            `INSERT INTO supplier_payments 
             (supplier_id, purchase_id, amount_paid, payment_date, payment_method, receipt_path, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [supplier_id, purchase_id || null, amount_paid, payment_date, payment_method, normalizedPath, notes]
        );
        return result.insertId;
    }
    
    static async findBySupplier(supplierId) {
        const [rows] = await db.query(
            `SELECT sp.*, p.purchase_date 
             FROM supplier_payments sp
             LEFT JOIN purchases p ON sp.purchase_id = p.id
             WHERE sp.supplier_id = ?
             ORDER BY sp.payment_date DESC`,
            [supplierId]
        );
        return rows;
    }
    
    static async getSupplierBalance(supplierId) {
        const [purchases] = await db.query(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE supplier_id = ?',
            [supplierId]
        );
        
        const [payments] = await db.query(
            'SELECT COALESCE(SUM(amount_paid), 0) as total FROM supplier_payments WHERE supplier_id = ?',
            [supplierId]
        );
        
        return {
            totalPurchases: purchases[0].total,
            totalPaid: payments[0].total,
            balance: purchases[0].total - payments[0].total
        };
    }
}

module.exports = Payment;