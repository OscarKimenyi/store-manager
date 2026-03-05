// Purchases Management Module
let purchasesTable;
let deletePurchaseId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePurchasesTable();
    initializeEventListeners();
    loadProducts();
    loadSuppliers();
    
    // Check if product is pre-selected
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    if (productId) {
        setTimeout(() => {
            document.getElementById('product_id').value = productId;
        }, 500);
    }
});

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            purchasesTable.search(this.value).draw();
        });
    }
    
    // Date range filters
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            applyDateFilter();
        });
    }
    
    // Supplier filter
    const supplierFilter = document.getElementById('supplierFilter');
    if (supplierFilter) {
        supplierFilter.addEventListener('change', function() {
            purchasesTable.column(2).search(this.value).draw();
        });
    }
    
    // Quantity and price change for total calculation
    const quantity = document.getElementById('quantity');
    const unitPrice = document.getElementById('unit_price');
    if (quantity && unitPrice) {
        [quantity, unitPrice].forEach(field => {
            field.addEventListener('input', calculateTotal);
        });
    }
}

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('unit_price').value) || 0;
    const total = quantity * unitPrice;
    document.getElementById('total_amount').value = formatCurrency(total);
}

async function loadProducts() {
    try {
        const products = await API.get('/products');
        const select = document.getElementById('product_id');
        if (select) {
            select.innerHTML = '<option value="">Select Product</option>' + 
                products.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (Stock: ${p.quantity})</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function loadSuppliers() {
    try {
        const suppliers = await API.get('/suppliers');
        const selects = ['supplier_id', 'supplierFilter'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">All Suppliers</option>' + 
                    suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
            }
        });
    } catch (error) {
        console.error('Failed to load suppliers:', error);
    }
}

function initializePurchasesTable() {
    if (!document.getElementById('purchasesTable')) return;
    
    loadPurchases().then(purchases => {
        purchasesTable = $('#purchasesTable').DataTable({
            data: purchases,
            columns: [
                {
                    data: 'purchase_date',
                    render: function(data) {
                        return formatDate(data);
                    }
                },
                { data: 'product_name' },
                { data: 'supplier_name' },
                {
                    data: 'quantity',
                    render: function(data) {
                        return formatNumber(data);
                    }
                },
                {
                    data: 'unit_price',
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
                {
                    data: 'payment_status',
                    render: function(data) {
                        return getStatusBadge(data);
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <button class="btn btn-sm btn-outline-info me-1" onclick="viewPurchase(${data.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editPurchase(${data.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                        `;
                    }
                }
            ],
            order: [[0, 'desc']],
            pageLength: 10,
            language: {
                search: "",
                searchPlaceholder: "Search purchases..."
            }
        });
    });
}

async function loadPurchases(filters = {}) {
    try {
        let url = '/purchases';
        const params = new URLSearchParams(filters).toString();
        if (params) url += '?' + params;
        
        const purchases = await API.get(url);
        return purchases;
    } catch (error) {
        console.error('Failed to load purchases:', error);
        Toast.error('Failed to load purchases');
        return [];
    }
}

function openPurchaseModal() {
    resetPurchaseForm();
    document.getElementById('modalTitle').textContent = 'Add Purchase';
    new bootstrap.Modal(document.getElementById('purchaseModal')).show();
}

function resetPurchaseForm() {
    document.getElementById('purchaseId').value = '';
    document.getElementById('product_id').value = '';
    document.getElementById('supplier_id').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('unit_price').value = '';
    document.getElementById('purchase_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('payment_status').value = 'Unpaid';
    document.getElementById('notes').value = '';
    document.getElementById('total_amount').value = '';
}

function editPurchase(id) {
    API.get(`/purchases/${id}`).then(purchase => {
        document.getElementById('modalTitle').textContent = 'Edit Purchase';
        document.getElementById('purchaseId').value = purchase.id;
        document.getElementById('product_id').value = purchase.product_id;
        document.getElementById('supplier_id').value = purchase.supplier_id;
        document.getElementById('quantity').value = purchase.quantity;
        document.getElementById('unit_price').value = purchase.unit_price;
        document.getElementById('purchase_date').value = purchase.purchase_date.split('T')[0];
        document.getElementById('payment_status').value = purchase.payment_status;
        document.getElementById('notes').value = purchase.notes || '';
        calculateTotal();
        
        new bootstrap.Modal(document.getElementById('purchaseModal')).show();
    }).catch(error => {
        Toast.error('Failed to load purchase details');
    });
}

function savePurchase() {
    const form = document.getElementById('purchaseForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const purchaseData = {
        product_id: document.getElementById('product_id').value,
        supplier_id: document.getElementById('supplier_id').value,
        quantity: document.getElementById('quantity').value,
        unit_price: document.getElementById('unit_price').value,
        purchase_date: document.getElementById('purchase_date').value,
        payment_status: document.getElementById('payment_status').value,
        notes: document.getElementById('notes').value
    };
    
    const purchaseId = document.getElementById('purchaseId').value;
    const method = purchaseId ? 'put' : 'post';
    const endpoint = purchaseId ? `/purchases/${purchaseId}` : '/purchases';
    
    API[method](endpoint, purchaseData).then(response => {
        Toast.success(purchaseId ? 'Purchase updated successfully' : 'Purchase added successfully');
        bootstrap.Modal.getInstance(document.getElementById('purchaseModal')).hide();
        refreshTable();
    }).catch(error => {
        Toast.error('Failed to save purchase');
    });
}

function viewPurchase(id) {
    API.get(`/purchases/${id}`).then(purchase => {
        // Display purchase details in a modal or navigate to details page
        showPurchaseDetails(purchase);
    });
}

function showPurchaseDetails(purchase) {
    const detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Product:</strong> ${escapeHtml(purchase.product_name)}</p>
                <p><strong>Supplier:</strong> ${escapeHtml(purchase.supplier_name)}</p>
                <p><strong>Date:</strong> ${formatDate(purchase.purchase_date)}</p>
                <p><strong>Quantity:</strong> ${formatNumber(purchase.quantity)}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Unit Price:</strong> ${formatCurrency(purchase.unit_price)}</p>
                <p><strong>Total Amount:</strong> ${formatCurrency(purchase.total_amount)}</p>
                <p><strong>Paid:</strong> ${formatCurrency(purchase.total_paid)}</p>
                <p><strong>Balance:</strong> ${formatCurrency(purchase.balance)}</p>
                <p><strong>Status:</strong> ${getStatusBadge(purchase.payment_status)}</p>
            </div>
            ${purchase.notes ? `<div class="col-12"><p><strong>Notes:</strong> ${escapeHtml(purchase.notes)}</p></div>` : ''}
        </div>
    `;
    
    // Create and show modal
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal._element.innerHTML = `
        <div class="modal fade">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Purchase Details #${purchase.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${detailsHtml}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="makePayment(${purchase.id})">Make Payment</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal._element);
    modal.show();
}

function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        loadPurchases({ start_date: startDate, end_date: endDate }).then(purchases => {
            purchasesTable.clear();
            purchasesTable.rows.add(purchases);
            purchasesTable.draw();
        });
    }
}

function makePayment(purchaseId) {
    window.location.href = `/payments?purchase=${purchaseId}`;
}

function refreshTable() {
    loadPurchases().then(purchases => {
        purchasesTable.clear();
        purchasesTable.rows.add(purchases);
        purchasesTable.draw();
    });
}

// Export functions
window.openPurchaseModal = openPurchaseModal;
window.editPurchase = editPurchase;
window.savePurchase = savePurchase;
window.makePayment = makePayment;