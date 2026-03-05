const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middleware/auth');

// Routes
router.get('/stock', isAuthenticated, reportController.getStockReport);
router.get('/low-stock', isAuthenticated, reportController.getLowStockReport);
router.get('/purchases', isAuthenticated, reportController.getPurchaseReport);
router.get('/payments', isAuthenticated, reportController.getPaymentReport);
router.get('/unpaid-balances', isAuthenticated, reportController.getUnpaidBalancesReport);
router.get('/sales', isAuthenticated, reportController.getSalesReport);
router.post('/export/pdf', isAuthenticated, reportController.exportReportToPDF);

module.exports = router;