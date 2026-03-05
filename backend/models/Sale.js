const db = require('../config/database');

class Sale {
    static async findAll(filters = {}) {
        let query = `
            SELECT s.*, p.name as product_name, p.unit_type
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE p.is_deleted = false
        `;
        const params = [];
        
        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(s.sale_date) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }
        
        if (filters.product_id) {
            query += ' AND s.product_id = ?';
            params.push(filters.product_id);
        }
        
        query += ' ORDER BY s.sale_date DESC';
        
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }
        
        const [rows] = await db.query(query, params);
        return rows;
    }
    
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT s.*, p.name as product_name, p.unit_type, p.selling_price 
             FROM sales s
             JOIN products p ON s.product_id = p.id
             WHERE s.id = ?`,
            [id]
        );
        return rows[0];
    }
    
    static async create(saleData) {
        const { product_id, quantity, selling_price, sale_date, customer_name, customer_phone, payment_method, notes } = saleData;
        
        const [result] = await db.query(
            `INSERT INTO sales 
             (product_id, quantity, selling_price, sale_date, customer_name, customer_phone, payment_method, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [product_id, quantity, selling_price, sale_date, customer_name, customer_phone, payment_method, notes]
        );
        return result.insertId;
    }
    
    static async getDailySales(date) {
        const [rows] = await db.query(
            `SELECT 
                DATE(sale_date) as date,
                COUNT(*) as total_transactions,
                SUM(quantity) as total_items,
                SUM(total_amount) as total_sales
             FROM sales 
             WHERE DATE(sale_date) = ?
             GROUP BY DATE(sale_date)`,
            [date]
        );
        return rows[0] || { date, total_transactions: 0, total_items: 0, total_sales: 0 };
    }
    
    static async getMonthlySales(year, month) {
        const [rows] = await db.query(
            `SELECT 
                DATE(sale_date) as date,
                COUNT(*) as transactions,
                SUM(total_amount) as total
             FROM sales 
             WHERE YEAR(sale_date) = ? AND MONTH(sale_date) = ?
             GROUP BY DATE(sale_date)
             ORDER BY date ASC`,
            [year, month]
        );
        return rows;
    }
    
    static async getTopProducts(limit = 10) {
        const [rows] = await db.query(
            `SELECT 
                p.id,
                p.name,
                p.unit_type,
                COUNT(s.id) as times_sold,
                SUM(s.quantity) as total_quantity,
                SUM(s.total_amount) as total_revenue
             FROM sales s
             JOIN products p ON s.product_id = p.id
             WHERE p.is_deleted = false
             GROUP BY p.id, p.name, p.unit_type
             ORDER BY total_quantity DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }
}

module.exports = Sale;