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
            if (purchasesTable) {
                purchasesTable.search(this.value).draw();
            }
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
            if (purchasesTable) {
                purchasesTable.column(2).search(this.value).draw();
            }
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
        Toast.error('Failed to load products');
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
        Toast.error('Failed to load suppliers');
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
                            <button class="btn btn-sm btn-outline-info me-1" onclick="viewPurchase(${data.id})" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary" onclick="makePayment(${data.id})" title="Make Payment">
                                <i class="bi bi-cash"></i>
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
    document.getElementById('modalTitle').textContent = 'New Purchase';
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

// FIXED: Save purchase function with better error handling
function savePurchase() {
    console.log('savePurchase function called'); // Debug log
    
    const form = document.getElementById('purchaseForm');
    
    // Check form validity
    if (!form.checkValidity()) {
        console.log('Form is invalid'); // Debug log
        form.reportValidity();
        return;
    }
    
    // Get form values
    const product_id = document.getElementById('product_id').value;
    const supplier_id = document.getElementById('supplier_id').value;
    const quantity = document.getElementById('quantity').value;
    const unit_price = document.getElementById('unit_price').value;
    const purchase_date = document.getElementById('purchase_date').value;
    const payment_status = document.getElementById('payment_status').value;
    const notes = document.getElementById('notes').value;
    
    // Validate required fields
    if (!product_id) {
        Toast.error('Please select a product');
        return;
    }
    if (!supplier_id) {
        Toast.error('Please select a supplier');
        return;
    }
    if (!quantity || quantity <= 0) {
        Toast.error('Please enter a valid quantity');
        return;
    }
    if (!unit_price || unit_price <= 0) {
        Toast.error('Please enter a valid unit price');
        return;
    }
    if (!purchase_date) {
        Toast.error('Please select a purchase date');
        return;
    }
    
    const purchaseData = {
        product_id: parseInt(product_id),
        supplier_id: parseInt(supplier_id),
        quantity: parseInt(quantity),
        unit_price: parseFloat(unit_price),
        purchase_date: purchase_date,
        payment_status: payment_status,
        notes: notes || ''
    };
    
    console.log('Saving purchase with data:', purchaseData); // Debug log
    
    // Show loading state on button
    const saveBtn = document.querySelector('#purchaseModal .btn-primary');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    saveBtn.disabled = true;
    
    // Make API call
    API.post('/purchases', purchaseData)
        .then(response => {
            console.log('Purchase saved successfully:', response); // Debug log
            Toast.success('Purchase added successfully');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('purchaseModal'));
            modal.hide();
            
            // Refresh table
            refreshTable();
        })
        .catch(error => {
            console.error('Failed to save purchase:', error); // Debug log
            Toast.error(error.message || 'Failed to save purchase');
        })
        .finally(() => {
            // Restore button state
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        });
}

function viewPurchase(id) {
    Spinner.show();
    API.get(`/purchases/${id}`).then(purchase => {
        showPurchaseDetails(purchase);
    }).catch(error => {
        Toast.error('Failed to load purchase details');
    }).finally(() => {
        Spinner.hide();
    });
}

function showPurchaseDetails(purchase) {
    // Create modal element if it doesn't exist
    let detailsModal = document.getElementById('purchaseDetailsModal');
    if (!detailsModal) {
        detailsModal = document.createElement('div');
        detailsModal.id = 'purchaseDetailsModal';
        detailsModal.className = 'modal fade';
        detailsModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Purchase Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="purchaseDetailsBody">
                        <!-- Content will be inserted here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="makePaymentFromDetails(${purchase.id})">Make Payment</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(detailsModal);
    }
    
    const detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Purchase ID:</strong> #${purchase.id}</p>
                <p><strong>Date:</strong> ${formatDate(purchase.purchase_date)}</p>
                <p><strong>Product:</strong> ${escapeHtml(purchase.product_name)}</p>
                <p><strong>Supplier:</strong> ${escapeHtml(purchase.supplier_name)}</p>
                <p><strong>Supplier Phone:</strong> ${escapeHtml(purchase.supplier_phone || 'N/A')}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Quantity:</strong> ${formatNumber(purchase.quantity)} ${purchase.unit_type || ''}</p>
                <p><strong>Unit Price:</strong> ${formatCurrency(purchase.unit_price)}</p>
                <p><strong>Total Amount:</strong> ${formatCurrency(purchase.total_amount)}</p>
                <p><strong>Paid:</strong> ${formatCurrency(purchase.total_paid || 0)}</p>
                <p><strong>Balance:</strong> ${formatCurrency(purchase.balance || purchase.total_amount)}</p>
                <p><strong>Status:</strong> ${getStatusBadge(purchase.payment_status)}</p>
            </div>
            ${purchase.notes ? `
            <div class="col-12 mt-3">
                <p><strong>Notes:</strong></p>
                <p class="text-muted">${escapeHtml(purchase.notes)}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('purchaseDetailsBody').innerHTML = detailsHtml;
    
    // Store purchase ID for payment button
    window.currentPurchaseId = purchase.id;
    
    const modal = new bootstrap.Modal(detailsModal);
    modal.show();
}

function makePaymentFromDetails(purchaseId) {
    // Close the details modal
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('purchaseDetailsModal'));
    if (detailsModal) {
        detailsModal.hide();
    }
    
    // Open payment page
    makePayment(purchaseId);
}

function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        loadPurchases({ start_date: startDate, end_date: endDate }).then(purchases => {
            if (purchasesTable) {
                purchasesTable.clear();
                purchasesTable.rows.add(purchases);
                purchasesTable.draw();
            }
        });
    } else {
        Toast.warning('Please select both start and end dates');
    }
}

function makePayment(purchaseId) {
    window.location.href = `/payments?purchase=${purchaseId}`;
}

function refreshTable() {
    loadPurchases().then(purchases => {
        if (purchasesTable) {
            purchasesTable.clear();
            purchasesTable.rows.add(purchases);
            purchasesTable.draw();
        }
    });
}

// Make functions globally available
window.openPurchaseModal = openPurchaseModal;
window.savePurchase = savePurchase;
window.viewPurchase = viewPurchase;
window.makePayment = makePayment;
window.makePaymentFromDetails = makePaymentFromDetails;