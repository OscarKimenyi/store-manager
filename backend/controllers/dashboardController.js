const db = require('../config/database');

exports.getStats = async (req, res) => {
    try {
        // Get total products
        const [products] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE is_deleted = false'
        );

        // Get total stock quantity
        const [stock] = await db.query(
            'SELECT SUM(quantity) as total FROM products WHERE is_deleted = false'
        );

        // Get low stock count
        const [lowStock] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE quantity <= min_stock_level AND is_deleted = false'
        );

        // Get total purchases this month
        const [purchases] = await db.query(
            'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE MONTH(purchase_date) = MONTH(CURRENT_DATE()) AND YEAR(purchase_date) = YEAR(CURRENT_DATE())'
        );

        // Get total supplier payments this month
        const [payments] = await db.query(
            'SELECT COALESCE(SUM(amount_paid), 0) as total FROM supplier_payments WHERE MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())'
        );

        // Get recent purchases
        const [recentPurchases] = await db.query(`
            SELECT p.*, pr.name as product_name, s.name as supplier_name 
            FROM purchases p
            JOIN products pr ON p.product_id = pr.id
            JOIN suppliers s ON p.supplier_id = s.id
            WHERE pr.is_deleted = false AND s.is_deleted = false
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        // Get low stock products
        const [lowStockProducts] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.quantity <= p.min_stock_level AND p.is_deleted = false
            ORDER BY p.quantity ASC
            LIMIT 10
        `);

        res.json({
            totalProducts: products[0].count || 0,
            totalStock: stock[0].total || 0,
            lowStockCount: lowStock[0].count || 0,
            totalPurchases: purchases[0].count || 0,
            purchaseTotal: purchases[0].total || 0,
            totalPayments: payments[0].total || 0,
            recentPurchases,
            lowStockProducts
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to load dashboard statistics' });
    }
};