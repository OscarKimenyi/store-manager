// Sales Management Module
let salesTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeSalesTable();
    initializeEventListeners();
    loadProducts();
    loadDailySummary();
});

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            salesTable.search(this.value).draw();
        });
    }
    
    // Date range filters
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            applyDateFilter();
        });
    }
    
    // Product change for price and stock validation
    const productSelect = document.getElementById('product_id');
    if (productSelect) {
        productSelect.addEventListener('change', function() {
            if (this.value) {
                loadProductDetails(this.value);
            }
        });
    }
    
    // Quantity change for total calculation and stock validation
    const quantity = document.getElementById('quantity');
    if (quantity) {
        quantity.addEventListener('input', function() {
            calculateTotal();
            validateStock();
        });
    }
}

async function loadProducts() {
    try {
        const products = await API.get('/products');
        const select = document.getElementById('product_id');
        if (select) {
            select.innerHTML = '<option value="">Select Product</option>' + 
                products.map(p => `<option value="${p.id}" data-price="${p.selling_price}" data-stock="${p.quantity}">${escapeHtml(p.name)} (Stock: ${p.quantity})</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function loadProductDetails(productId) {
    const select = document.getElementById('product_id');
    const selected = select.options[select.selectedIndex];
    const price = selected.dataset.price;
    const stock = selected.dataset.stock;
    
    document.getElementById('selling_price').value = price;
    document.getElementById('available_stock').textContent = `Available: ${stock}`;
    
    calculateTotal();
    validateStock();
}

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('selling_price').value) || 0;
    const total = quantity * price;
    document.getElementById('total_amount').value = formatCurrency(total);
}

function validateStock() {
    const select = document.getElementById('product_id');
    const selected = select.options[select.selectedIndex];
    const availableStock = parseInt(selected?.dataset.stock) || 0;
    const requestedQuantity = parseInt(document.getElementById('quantity').value) || 0;
    
    const stockWarning = document.getElementById('stockWarning');
    const saveBtn = document.querySelector('#saleModal .btn-primary');
    
    if (requestedQuantity > availableStock) {
        if (stockWarning) {
            stockWarning.style.display = 'block';
            stockWarning.textContent = `Insufficient stock! Only ${availableStock} available.`;
        }
        if (saveBtn) saveBtn.disabled = true;
    } else {
        if (stockWarning) stockWarning.style.display = 'none';
        if (saveBtn) saveBtn.disabled = false;
    }
}

function initializeSalesTable() {
    if (!document.getElementById('salesTable')) return;
    
    loadSales().then(sales => {
        salesTable = $('#salesTable').DataTable({
            data: sales,
            columns: [
                {
                    data: 'sale_date',
                    render: function(data) {
                        // Format date without time
                        if (!data) return 'N/A';
                        const date = new Date(data);
                        return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                },
                { data: 'product_name' },
                {
                    data: 'quantity',
                    render: function(data) {
                        return formatNumber(data);
                    }
                },
                {
                    data: 'selling_price',
                    render: function(data) {
                        return formatCurrency(data);
                    }
                },
                {
                    data: 'total_amount',
                    render: function(data) {
                        return formatCurrency(data);
                    }
                },
                { data: 'customer_name' },
                { data: 'payment_method' },
                {
                    data: 'created_at',
                    render: function(data) {
                        return formatDate(data);
                    }
                }
            ],
            order: [[0, 'desc']],
            pageLength: 10,
            language: {
                search: "",
                searchPlaceholder: "Search sales..."
            }
        });
    });
}

async function loadSales(filters = {}) {
    try {
        let url = '/sales';
        const params = new URLSearchParams(filters).toString();
        if (params) url += '?' + params;
        
        const sales = await API.get(url);
        return sales;
    } catch (error) {
        console.error('Failed to load sales:', error);
        Toast.error('Failed to load sales');
        return [];
    }
}

async function loadDailySummary() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const summary = await API.get(`/sales/daily?date=${today}`);
        
        document.getElementById('todayTransactions').textContent = summary.total_transactions || 0;
        document.getElementById('todayItems').textContent = summary.total_items || 0;
        document.getElementById('todaySales').textContent = formatCurrency(summary.total_sales || 0);
    } catch (error) {
        console.error('Failed to load daily summary:', error);
    }
}

function openSaleModal() {
    resetSaleForm();
    document.getElementById('modalTitle').textContent = 'Record Sale';
    new bootstrap.Modal(document.getElementById('saleModal')).show();
}

function resetSaleForm() {
    document.getElementById('saleId').value = '';
    document.getElementById('product_id').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('selling_price').value = '';
    document.getElementById('sale_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('customer_name').value = '';
    document.getElementById('customer_phone').value = '';
    document.getElementById('payment_method').value = 'Cash';
    document.getElementById('notes').value = '';
    document.getElementById('total_amount').value = '';
    document.getElementById('available_stock').textContent = 'Available: 0';
    document.getElementById('stockWarning').style.display = 'none';
}

async function saveSale() {
    const form = document.getElementById('saleForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Validate stock again
    const select = document.getElementById('product_id');
    const selected = select.options[select.selectedIndex];
    const availableStock = parseInt(selected?.dataset.stock) || 0;
    const requestedQuantity = parseInt(document.getElementById('quantity').value) || 0;
    
    if (requestedQuantity > availableStock) {
        Toast.error(`Insufficient stock! Only ${availableStock} available.`);
        return;
    }
    
    const saleData = {
        product_id: document.getElementById('product_id').value,
        quantity: document.getElementById('quantity').value,
        selling_price: document.getElementById('selling_price').value,
        sale_date: document.getElementById('sale_date').value,
        customer_name: document.getElementById('customer_name').value,
        customer_phone: document.getElementById('customer_phone').value,
        payment_method: document.getElementById('payment_method').value,
        notes: document.getElementById('notes').value
    };
    
    const saleId = document.getElementById('saleId').value;
    const method = saleId ? 'put' : 'post';
    const endpoint = saleId ? `/sales/${saleId}` : '/sales';
    
    try {
        await API[method](endpoint, saleData);
        Toast.success('Sale recorded successfully');
        bootstrap.Modal.getInstance(document.getElementById('saleModal')).hide();
        
        if (document.getElementById('salesTable')) {
            refreshTable();
        }
        loadDailySummary();
    } catch (error) {
        Toast.error('Failed to record sale');
    }
}

function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        loadSales({ start_date: startDate, end_date: endDate }).then(sales => {
            salesTable.clear();
            salesTable.rows.add(sales);
            salesTable.draw();
        });
    }
}

function refreshTable() {
    loadSales().then(sales => {
        salesTable.clear();
        salesTable.rows.add(sales);
        salesTable.draw();
    });
}

// Export functions
window.openSaleModal = openSaleModal;
window.saveSale = saveSale;