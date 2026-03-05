const db = require('../config/database');
const PDFDocument = require('pdfkit');

exports.getStockReport = async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_deleted = false
            ORDER BY p.name ASC
        `);
        
        res.json(products);
    } catch (error) {
        console.error('Stock report error:', error);
        res.status(500).json({ error: 'Failed to generate stock report' });
    }
};

exports.getLowStockReport = async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.quantity <= p.min_stock_level AND p.is_deleted = false
            ORDER BY p.quantity ASC
        `);
        
        res.json(products);
    } catch (error) {
        console.error('Low stock report error:', error);
        res.status(500).json({ error: 'Failed to generate low stock report' });
    }
};

exports.getPurchaseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = `
            SELECT p.*, pr.name as product_name, s.name as supplier_name 
            FROM purchases p
            JOIN products pr ON p.product_id = pr.id
            JOIN suppliers s ON p.supplier_id = s.id
            WHERE pr.is_deleted = false AND s.is_deleted = false
        `;
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(p.purchase_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        query += ' ORDER BY p.purchase_date DESC';
        
        const [purchases] = await db.query(query, params);
        res.json(purchases);
    } catch (error) {
        console.error('Purchase report error:', error);
        res.status(500).json({ error: 'Failed to generate purchase report' });
    }
};

exports.getPaymentReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = `
            SELECT sp.*, s.name as supplier_name, p.purchase_date
            FROM supplier_payments sp
            JOIN suppliers s ON sp.supplier_id = s.id
            LEFT JOIN purchases p ON sp.purchase_id = p.id
            WHERE s.is_deleted = false
        `;
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(sp.payment_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        query += ' ORDER BY sp.payment_date DESC';
        
        const [payments] = await db.query(query, params);
        res.json(payments);
    } catch (error) {
        console.error('Payment report error:', error);
        res.status(500).json({ error: 'Failed to generate payment report' });
    }
};

exports.getUnpaidBalancesReport = async (req, res) => {
    try {
        const [balances] = await db.query(`
            SELECT 
                s.id as supplier_id,
                s.name as supplier_name,
                COUNT(DISTINCT p.id) as total_purchases,
                COALESCE(SUM(p.total_amount), 0) as total_amount,
                COALESCE(SUM(p.total_paid), 0) as total_paid,
                COALESCE(SUM(p.balance), 0) as total_balance
            FROM suppliers s
            LEFT JOIN purchases p ON s.id = p.supplier_id
            WHERE s.is_deleted = false
            GROUP BY s.id, s.name
            HAVING total_balance > 0
            ORDER BY total_balance DESC
        `);
        
        res.json(balances);
    } catch (error) {
        console.error('Unpaid balances report error:', error);
        res.status(500).json({ error: 'Failed to generate unpaid balances report' });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = `
            SELECT s.*, p.name as product_name, p.unit_type
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE p.is_deleted = false
        `;
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(s.sale_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        query += ' ORDER BY s.sale_date DESC';
        
        const [sales] = await db.query(query, params);
        res.json(sales);
    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({ error: 'Failed to generate sales report' });
    }
};

exports.exportReportToPDF = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        // Create PDF document
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
        
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(20).text(`${type} Report`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        
        // Add data table
        if (data && data.length > 0) {
            const headers = Object.keys(data[0]);
            let y = doc.y;
            
            // Draw headers
            headers.forEach((header, i) => {
                doc.text(header, 50 + (i * 100), y, { width: 90, align: 'left' });
            });
            
            y += 20;
            
            // Draw rows
            data.forEach((row, rowIndex) => {
                headers.forEach((header, colIndex) => {
                    doc.text(String(row[header] || ''), 50 + (colIndex * 100), y + (rowIndex * 20), { width: 90, align: 'left' });
                });
            });
        }
        
        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
};