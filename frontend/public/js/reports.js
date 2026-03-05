// Reports Management Module
let currentReportData = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadReport('stock'); // Load default report
});

function initializeEventListeners() {
    // Report type change
    const reportType = document.getElementById('reportType');
    if (reportType) {
        reportType.addEventListener('change', function() {
            loadReport(this.value);
        });
    }
    
    // Generate report button
    const generateBtn = document.getElementById('generateReport');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            generateReport();
        });
    }
    
    // Export buttons
    const exportPdfBtn = document.getElementById('exportPdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            exportToPDF();
        });
    }
    
    const exportCsvBtn = document.getElementById('exportCsv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function() {
            exportToCSV();
        });
    }
    
    const printBtn = document.getElementById('printReport');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            printReport();
        });
    }
}

async function loadReport(type) {
    const reportTitle = document.getElementById('reportTitle');
    const tableContainer = document.getElementById('reportTableContainer');
    
    if (!reportTitle || !tableContainer) return;
    
    // Set title
    const titles = {
        'stock': 'Current Stock Report',
        'low-stock': 'Low Stock Report',
        'purchases': 'Purchase Report',
        'payments': 'Supplier Payment Report',
        'unpaid': 'Unpaid Supplier Balances',
        'sales': 'Sales Report'
    };
    reportTitle.textContent = titles[type] || 'Report';
    
    try {
        let data = [];
        switch(type) {
            case 'stock':
                data = await API.get('/reports/stock');
                renderStockReport(data);
                break;
            case 'low-stock':
                data = await API.get('/reports/low-stock');
                renderLowStockReport(data);
                break;
            case 'purchases':
                data = await API.get('/reports/purchases');
                renderPurchaseReport(data);
                break;
            case 'payments':
                data = await API.get('/reports/payments');
                renderPaymentReport(data);
                break;
            case 'unpaid':
                data = await API.get('/reports/unpaid-balances');
                renderUnpaidBalancesReport(data);
                break;
            case 'sales':
                data = await API.get('/reports/sales');
                renderSalesReport(data);
                break;
        }
        
        currentReportData = data;
        
        // Show date filters for applicable reports
        const dateFilters = document.getElementById('dateFilters');
        if (dateFilters) {
            const showDateFilters = ['purchases', 'payments', 'sales'].includes(type);
            dateFilters.style.display = showDateFilters ? 'flex' : 'none';
        }
        
    } catch (error) {
        console.error('Failed to load report:', error);
        Toast.error('Failed to generate report');
    }
}

function renderStockReport(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category_name || 'N/A')}</td>
            <td>${escapeHtml(item.size || 'N/A')}</td>
            <td>${item.unit_type}</td>
            <td>${formatCurrency(item.buying_price)}</td>
            <td>${formatCurrency(item.selling_price)}</td>
            <td class="${item.quantity <= item.min_stock_level ? 'text-danger fw-bold' : ''}">${formatNumber(item.quantity)}</td>
            <td>${formatNumber(item.min_stock_level)}</td>
        </tr>
    `).join('');
}

function renderLowStockReport(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-success">No low stock items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category_name || 'N/A')}</td>
            <td>${escapeHtml(item.size || 'N/A')}</td>
            <td>${item.unit_type}</td>
            <td class="text-danger fw-bold">${formatNumber(item.quantity)}</td>
            <td>${formatNumber(item.min_stock_level)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="restockProduct(${item.id})">
                    <i class="bi bi-plus-circle"></i> Restock
                </button>
            </td>
        </tr>
    `).join('');
}

function renderPurchaseReport(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No purchases found</td></tr>';
        return;
    }
    
    let totalAmount = 0;
    
    tbody.innerHTML = data.map(item => {
        totalAmount += parseFloat(item.total_amount);
        return `
            <tr>
                <td>${formatDate(item.purchase_date)}</td>
                <td>${escapeHtml(item.product_name)}</td>
                <td>${escapeHtml(item.supplier_name)}</td>
                <td>${formatNumber(item.quantity)}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.total_amount)}</td>
                <td>${getStatusBadge(item.payment_status)}</td>
                <td>${escapeHtml(item.notes || '')}</td>
            </tr>
        `;
    }).join('');
    
    // Add total row
    tbody.innerHTML += `
        <tr class="table-info fw-bold">
            <td colspan="5" class="text-end">Total:</td>
            <td>${formatCurrency(totalAmount)}</td>
            <td colspan="2"></td>
        </tr>
    `;
}

function renderPaymentReport(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No payments found</td></tr>';
        return;
    }
    
    let totalPaid = 0;
    
    tbody.innerHTML = data.map(item => {
        totalPaid += parseFloat(item.amount_paid);
        return `
            <tr>
                <td>${formatDate(item.payment_date)}</td>
                <td>${escapeHtml(item.supplier_name)}</td>
                <td>#${item.purchase_id || 'N/A'}</td>
                <td>${formatCurrency(item.amount_paid)}</td>
                <td><span class="badge bg-info">${escapeHtml(item.payment_method)}</span></td>
                <td>
                    ${item.receipt_path ? 
                        `<button class="btn btn-sm btn-outline-success" onclick="viewReceipt('${item.receipt_path}')">
                            <i class="bi bi-file-earmark-pdf"></i> View
                        </button>` : 
                        'N/A'
                    }
                </td>
                <td>${escapeHtml(item.notes || '')}</td>
                <td>${formatDate(item.created_at)}</td>
            </tr>
        `;
    }).join('');
    
    // Add total row
    tbody.innerHTML += `
        <tr class="table-info fw-bold">
            <td colspan="3" class="text-end">Total Paid:</td>
            <td>${formatCurrency(totalPaid)}</td>
            <td colspan="4"></td>
        </tr>
    `;
}

function renderUnpaidBalancesReport(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-success">No unpaid balances found</td></tr>';
        return;
    }
    
    let totalBalance = 0;
    
    tbody.innerHTML = data.map(item => {
        totalBalance += parseFloat(item.total_balance);
        return `
            <tr>
                <td>${escapeHtml(item.supplier_name)}</td>
                <td>${formatNumber(item.total_purchases)}</td>
                <td>${formatCurrency(item.total_amount)}</td>
                <td>${formatCurrency(item.total_paid)}</td>
                <td class="text-danger fw-bold">${formatCurrency(item.total_balance)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="makePayment(null, ${item.supplier_id})">
                        <i class="bi bi-cash"></i> Make Payment
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add total row
    tbody.innerHTML += `
        <tr class="table-info fw-bold">
            <td colspan="4" class="text-end">Total Outstanding:</td>
            <td>${formatCurrency(totalBalance)}</td>
            <td></td>
        </tr>
    `;
}

function renderSalesReport(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No sales found</td></tr>';
        return;
    }
    
    let totalRevenue = 0;
    let totalItems = 0;
    
    tbody.innerHTML = data.map(item => {
        totalRevenue += parseFloat(item.total_amount);
        totalItems += parseInt(item.quantity);
        return `
            <tr>
                <td>${formatDate(item.sale_date)}</td>
                <td>${escapeHtml(item.product_name)}</td>
                <td>${escapeHtml(item.unit_type)}</td>
                <td>${formatNumber(item.quantity)}</td>
                <td>${formatCurrency(item.selling_price)}</td>
                <td>${formatCurrency(item.total_amount)}</td>
                <td>${escapeHtml(item.customer_name || 'Walk-in')}</td>
                <td><span class="badge bg-info">${escapeHtml(item.payment_method)}</span></td>
            </tr>
        `;
    }).join('');
    
    // Add total row
    tbody.innerHTML += `
        <tr class="table-info fw-bold">
            <td colspan="3" class="text-end">Totals:</td>
            <td>${formatNumber(totalItems)} items</td>
            <td></td>
            <td>${formatCurrency(totalRevenue)}</td>
            <td colspan="2"></td>
        </tr>
    `;
}

async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    try {
        let data;
        switch(reportType) {
            case 'purchases':
                data = await API.get(`/reports/purchases?startDate=${startDate}&endDate=${endDate}`);
                renderPurchaseReport(data);
                break;
            case 'payments':
                data = await API.get(`/reports/payments?startDate=${startDate}&endDate=${endDate}`);
                renderPaymentReport(data);
                break;
            case 'sales':
                data = await API.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
                renderSalesReport(data);
                break;
        }
        currentReportData = data;
    } catch (error) {
        Toast.error('Failed to generate report');
    }
}

async function exportToPDF() {
    const reportType = document.getElementById('reportType').value;
    const reportTitle = document.getElementById('reportTitle').textContent;
    
    try {
        const response = await fetch('/api/reports/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: reportType,
                title: reportTitle,
                data: currentReportData
            })
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Export failed:', error);
        Toast.error('Failed to export PDF');
    }
}

function exportToCSV() {
    if (!currentReportData || currentReportData.length === 0) {
        Toast.error('No data to export');
        return;
    }
    
    // Get headers
    const headers = Object.keys(currentReportData[0]);
    
    // Convert to CSV
    const csvContent = [
        headers.join(','),
        ...currentReportData.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function printReport() {
    window.print();
}

function restockProduct(productId) {
    window.location.href = `/purchases?product=${productId}`;
}

function makePayment(purchaseId, supplierId) {
    let url = '/payments?';
    if (purchaseId) url += `purchase=${purchaseId}`;
    else if (supplierId) url += `supplier=${supplierId}`;
    window.location.href = url;
}

function viewReceipt(path) {
    window.open('/' + path, '_blank');
}

// Export functions
window.loadReport = loadReport;
window.exportToPDF = exportToPDF;
window.exportToCSV = exportToCSV;
window.printReport = printReport;
window.restockProduct = restockProduct;
window.makePayment = makePayment;
window.viewReceipt = viewReceipt;