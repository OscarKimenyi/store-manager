document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadLowStockAlerts();
    loadRecentPurchases();
    initializeCharts();
});

async function loadDashboardData() {
    try {
        const data = await API.get('/dashboard/stats');
        
        // Update stat cards
        document.getElementById('totalProducts').textContent = formatNumber(data.totalProducts || 0);
        document.getElementById('totalStock').textContent = formatNumber(data.totalStock || 0);
        document.getElementById('lowStockItems').textContent = formatNumber(data.lowStockCount || 0);
        document.getElementById('totalPurchases').textContent = formatNumber(data.totalPurchases || 0);
        document.getElementById('purchaseTotal').textContent = formatCurrency(data.purchaseTotal || 0);
        document.getElementById('totalPayments').textContent = formatCurrency(data.totalPayments || 0);
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        Toast.error('Failed to load dashboard statistics');
    }
}

async function loadLowStockAlerts() {
    try {
        const products = await API.get('/products/low-stock');
        const tbody = document.querySelector('#lowStockTable tbody');
        
        if (!tbody) return;
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No low stock items found</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <div class="fw-semibold">${escapeHtml(product.name)}</div>
                    <small class="text-muted">Size: ${escapeHtml(product.size || 'N/A')}</small>
                </td>
                <td>${escapeHtml(product.category_name || 'N/A')}</td>
                <td class="fw-bold text-danger">${formatNumber(product.quantity)}</td>
                <td>${formatNumber(product.min_stock_level)}</td>
                <td><span class="badge-low-stock">Low Stock</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="restockProduct(${product.id})">
                        <i class="bi bi-plus-circle"></i> Restock
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load low stock alerts:', error);
    }
}

async function loadRecentPurchases() {
    try {
        const purchases = await API.get('/purchases?limit=10');
        const tbody = document.querySelector('#recentPurchasesTable tbody');
        
        if (!tbody) return;
        
        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No recent purchases found</td></tr>';
            return;
        }
        
        tbody.innerHTML = purchases.map(purchase => `
            <tr>
                <td>${formatDate(purchase.purchase_date)}</td>
                <td>${escapeHtml(purchase.product_name)}</td>
                <td>${escapeHtml(purchase.supplier_name)}</td>
                <td>${formatNumber(purchase.quantity)}</td>
                <td>${formatCurrency(purchase.total_amount)}</td>
                <td>${getStatusBadge(purchase.payment_status)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load recent purchases:', error);
    }
}

function initializeCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChart')?.getContext('2d');
    if (salesCtx) {
        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Sales',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Stock Distribution Chart
    const stockCtx = document.getElementById('stockChart')?.getContext('2d');
    if (stockCtx) {
        new Chart(stockCtx, {
            type: 'doughnut',
            data: {
                labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function restockProduct(productId) {
    window.location.href = `/purchases?product=${productId}`;
}