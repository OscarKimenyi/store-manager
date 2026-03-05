// Payments Management Module
let paymentsTable;
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePaymentsTable();
    initializeEventListeners();
    loadSuppliers();
    
    // Check if purchase is pre-selected
    const urlParams = new URLSearchParams(window.location.search);
    const purchaseId = urlParams.get('purchase');
    if (purchaseId) {
        setTimeout(() => {
            document.getElementById('purchase_id').value = purchaseId;
            loadPurchaseDetails(purchaseId);
        }, 500);
    }
});

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            paymentsTable.search(this.value).draw();
        });
    }
    
    // Date range filters
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            applyDateFilter();
        });
    }
    
    // Supplier change
    const supplierSelect = document.getElementById('supplier_id');
    if (supplierSelect) {
        supplierSelect.addEventListener('change', function() {
            if (this.value) {
                loadSupplierBalance(this.value);
                loadSupplierPurchases(this.value);
            }
        });
    }
    
    // File input change
    const receiptFile = document.getElementById('receipt');
    if (receiptFile) {
        receiptFile.addEventListener('change', function(e) {
            selectedFile = e.target.files[0];
        });
    }
}

async function loadSuppliers() {
    try {
        const suppliers = await API.get('/suppliers');
        const selects = ['supplier_id', 'supplierFilter'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">Select Supplier</option>' + 
                    suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
            }
        });
    } catch (error) {
        console.error('Failed to load suppliers:', error);
    }
}

async function loadSupplierBalance(supplierId) {
    try {
        const payments = await API.get(`/payments/supplier/${supplierId}`);
        // Calculate total paid
        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
        document.getElementById('totalPaidDisplay').textContent = formatCurrency(totalPaid);
    } catch (error) {
        console.error('Failed to load supplier balance:', error);
    }
}

async function loadSupplierPurchases(supplierId) {
    try {
        const purchases = await API.get(`/purchases?supplier_id=${supplierId}&payment_status=Unpaid,Partial`);
        const select = document.getElementById('purchase_id');
        if (select) {
            select.innerHTML = '<option value="">Select Purchase (Optional)</option>' + 
                purchases.map(p => `<option value="${p.id}">#${p.id} - ${escapeHtml(p.product_name)} (Balance: ${formatCurrency(p.balance)})</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load supplier purchases:', error);
    }
}

async function loadPurchaseDetails(purchaseId) {
    try {
        const purchase = await API.get(`/purchases/${purchaseId}`);
        document.getElementById('supplier_id').value = purchase.supplier_id;
        document.getElementById('amount_paid').value = purchase.balance;
        await loadSupplierPurchases(purchase.supplier_id);
    } catch (error) {
        console.error('Failed to load purchase details:', error);
    }
}

function initializePaymentsTable() {
    if (!document.getElementById('paymentsTable')) return;
    
    loadPayments().then(payments => {
        paymentsTable = $('#paymentsTable').DataTable({
            data: payments,
            columns: [
                {
                    data: 'payment_date',
                    render: function(data) {
                        return formatDate(data);
                    }
                },
                { data: 'supplier_name' },
                {
                    data: 'purchase_id',
                    render: function(data) {
                        return data ? `#${data}` : 'N/A';
                    }
                },
                {
                    data: 'amount_paid',
                    render: function(data) {
                        return formatCurrency(data);
                    }
                },
                { data: 'payment_method' },
                {
                    data: 'receipt_path',
                    render: function(data) {
                        return data ? 
                            `<button class="btn btn-sm btn-outline-success" onclick="viewReceipt('${data}')">
                                <i class="bi bi-file-earmark-pdf"></i> View
                            </button>` : 
                            '<span class="text-muted">No receipt</span>';
                    }
                },
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
                searchPlaceholder: "Search payments..."
            }
        });
    });
}

async function loadPayments(filters = {}) {
    try {
        let url = '/payments';
        const params = new URLSearchParams(filters).toString();
        if (params) url += '?' + params;
        
        const payments = await API.get(url);
        return payments;
    } catch (error) {
        console.error('Failed to load payments:', error);
        Toast.error('Failed to load payments');
        return [];
    }
}

function openPaymentModal() {
    resetPaymentForm();
    document.getElementById('modalTitle').textContent = 'Record Payment';
    new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

function resetPaymentForm() {
    document.getElementById('paymentId').value = '';
    document.getElementById('supplier_id').value = '';
    document.getElementById('purchase_id').value = '';
    document.getElementById('amount_paid').value = '';
    document.getElementById('payment_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('payment_method').value = 'Cash';
    document.getElementById('notes').value = '';
    document.getElementById('receipt').value = '';
    document.getElementById('totalPaidDisplay').textContent = '$0.00';
    selectedFile = null;
}

async function savePayment() {
    const form = document.getElementById('paymentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData();
    formData.append('supplier_id', document.getElementById('supplier_id').value);
    formData.append('purchase_id', document.getElementById('purchase_id').value || '');
    formData.append('amount_paid', document.getElementById('amount_paid').value);
    formData.append('payment_date', document.getElementById('payment_date').value);
    formData.append('payment_method', document.getElementById('payment_method').value);
    formData.append('notes', document.getElementById('notes').value);
    
    if (selectedFile) {
        formData.append('receipt', selectedFile);
    }
    
    try {
        const response = await API.upload('/payments', formData);
        Toast.success('Payment recorded successfully');
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        
        if (document.getElementById('paymentsTable')) {
            refreshTable();
        }
    } catch (error) {
        Toast.error('Failed to record payment');
    }
}

function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        loadPayments({ start_date: startDate, end_date: endDate }).then(payments => {
            paymentsTable.clear();
            paymentsTable.rows.add(payments);
            paymentsTable.draw();
        });
    }
}

function viewReceipt(path) {
    window.open('/' + path, '_blank');
}

function refreshTable() {
    loadPayments().then(payments => {
        paymentsTable.clear();
        paymentsTable.rows.add(payments);
        paymentsTable.draw();
    });
}

// Export functions
window.openPaymentModal = openPaymentModal;
window.savePayment = savePayment;
window.viewReceipt = viewReceipt;