// Payments Management Module
let paymentsTable;
let selectedFile = null;
let currentPurchaseId = null;
let currentPurchaseTotal = 0;
let currentPurchasePaid = 0;
let currentPurchaseBalance = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializePaymentsTable();
    initializeEventListeners();
    loadSuppliers();
    
    // Check if purchase is pre-selected
    const urlParams = new URLSearchParams(window.location.search);
    const purchaseId = urlParams.get('purchase');
    if (purchaseId) {
        currentPurchaseId = purchaseId;
        setTimeout(() => {
            document.getElementById('purchase_id').value = purchaseId;
            loadPurchaseDetails(purchaseId);
            openPaymentModal(); // Auto-open payment modal
        }, 500);
    }
});

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            if (paymentsTable) {
                paymentsTable.search(this.value).draw();
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
    
    // Purchase change - load purchase details
    const purchaseSelect = document.getElementById('purchase_id');
    if (purchaseSelect) {
        purchaseSelect.addEventListener('change', function() {
            if (this.value) {
                loadSelectedPurchaseDetails(this.value);
            } else {
                resetPaymentAmount();
            }
        });
    }
    
    // Amount paid input - validate against balance
    const amountPaid = document.getElementById('amount_paid');
    if (amountPaid) {
        amountPaid.addEventListener('input', function() {
            validatePaymentAmount();
        });
    }
    
    // Quick amount buttons
    document.querySelectorAll('.quick-amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const percentage = parseInt(this.dataset.percentage);
            setQuickAmount(percentage);
        });
    });
    
    // File input change
    const receiptFile = document.getElementById('receipt');
    if (receiptFile) {
        receiptFile.addEventListener('change', function(e) {
            selectedFile = e.target.files[0];
        });
    }
}

function setQuickAmount(percentage) {
    if (currentPurchaseBalance > 0) {
        const amount = (currentPurchaseBalance * percentage / 100).toFixed(2);
        document.getElementById('amount_paid').value = amount;
        validatePaymentAmount();
    }
}

function validatePaymentAmount() {
    const amountInput = document.getElementById('amount_paid');
    const amount = parseFloat(amountInput.value) || 0;
    const balanceRemaining = document.getElementById('balance_remaining');
    const paymentStatus = document.getElementById('payment_status_preview');
    const submitBtn = document.querySelector('#paymentModal .btn-primary');
    
    if (amount > currentPurchaseBalance) {
        amountInput.classList.add('is-invalid');
        if (balanceRemaining) {
            balanceRemaining.innerHTML = `<span class="text-danger">Amount exceeds balance! Max: ${formatCurrency(currentPurchaseBalance)}</span>`;
        }
        if (submitBtn) submitBtn.disabled = true;
    } else {
        amountInput.classList.remove('is-invalid');
        if (balanceRemaining) {
            const newBalance = currentPurchaseBalance - amount;
            balanceRemaining.innerHTML = `Remaining after payment: <strong>${formatCurrency(newBalance)}</strong>`;
        }
        if (submitBtn) submitBtn.disabled = false;
        
        // Update payment status preview
        if (paymentStatus) {
            if (amount >= currentPurchaseBalance) {
                paymentStatus.innerHTML = '<span class="badge-success">Status after payment: Paid</span>';
            } else if (amount > 0) {
                paymentStatus.innerHTML = '<span class="badge-warning">Status after payment: Partial</span>';
            } else {
                paymentStatus.innerHTML = '<span class="badge-danger">Status after payment: Unpaid</span>';
            }
        }
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
                purchases.map(p => `<option value="${p.id}" data-total="${p.total_amount}" data-paid="${p.total_paid || 0}" data-balance="${p.balance}">
                    #${p.id} - ${escapeHtml(p.product_name)} | Total: ${formatCurrency(p.total_amount)} | Paid: ${formatCurrency(p.total_paid || 0)} | Balance: ${formatCurrency(p.balance)}
                </option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load supplier purchases:', error);
    }
}

async function loadPurchaseDetails(purchaseId) {
    try {
        const purchase = await API.get(`/purchases/${purchaseId}`);
        document.getElementById('supplier_id').value = purchase.supplier_id;
        
        // Store purchase details
        currentPurchaseId = purchase.id;
        currentPurchaseTotal = parseFloat(purchase.total_amount);
        currentPurchasePaid = parseFloat(purchase.total_paid || 0);
        currentPurchaseBalance = parseFloat(purchase.balance || purchase.total_amount);
        
        // Set amount to balance by default
        document.getElementById('amount_paid').value = currentPurchaseBalance.toFixed(2);
        
        // Update UI with purchase info
        updatePurchaseInfo();
        
        await loadSupplierPurchases(purchase.supplier_id);
        
        // Select this purchase in dropdown
        setTimeout(() => {
            document.getElementById('purchase_id').value = purchaseId;
            loadSelectedPurchaseDetails(purchaseId);
        }, 500);
        
    } catch (error) {
        console.error('Failed to load purchase details:', error);
    }
}

function loadSelectedPurchaseDetails(purchaseId) {
    const select = document.getElementById('purchase_id');
    const selected = select.options[select.selectedIndex];
    
    if (selected && selected.value) {
        currentPurchaseId = purchaseId;
        currentPurchaseTotal = parseFloat(selected.dataset.total);
        currentPurchasePaid = parseFloat(selected.dataset.paid || 0);
        currentPurchaseBalance = parseFloat(selected.dataset.balance || currentPurchaseTotal);
        
        document.getElementById('amount_paid').value = currentPurchaseBalance.toFixed(2);
        updatePurchaseInfo();
    }
}

function updatePurchaseInfo() {
    const purchaseInfo = document.getElementById('purchase_info');
    if (purchaseInfo) {
        purchaseInfo.innerHTML = `
            <div class="alert alert-info">
                <div class="row">
                    <div class="col-md-4">
                        <strong>Total:</strong> ${formatCurrency(currentPurchaseTotal)}
                    </div>
                    <div class="col-md-4">
                        <strong>Paid:</strong> ${formatCurrency(currentPurchasePaid)}
                    </div>
                    <div class="col-md-4">
                        <strong>Balance:</strong> ${formatCurrency(currentPurchaseBalance)}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update balance remaining display
    const balanceRemaining = document.getElementById('balance_remaining');
    if (balanceRemaining) {
        balanceRemaining.innerHTML = `Remaining after payment: <strong>${formatCurrency(currentPurchaseBalance)}</strong>`;
    }
    
    // Show quick amount buttons
    const quickAmounts = document.getElementById('quick_amounts');
    if (quickAmounts) {
        quickAmounts.innerHTML = `
            <button type="button" class="btn btn-sm btn-outline-primary quick-amount-btn me-2" data-percentage="25">25%</button>
            <button type="button" class="btn btn-sm btn-outline-primary quick-amount-btn me-2" data-percentage="50">50%</button>
            <button type="button" class="btn btn-sm btn-outline-primary quick-amount-btn me-2" data-percentage="75">75%</button>
            <button type="button" class="btn btn-sm btn-outline-primary quick-amount-btn" data-percentage="100">100%</button>
        `;
        
        // Re-attach event listeners
        document.querySelectorAll('.quick-amount-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const percentage = parseInt(this.dataset.percentage);
                setQuickAmount(percentage);
            });
        });
    }
}

function resetPaymentAmount() {
    currentPurchaseId = null;
    currentPurchaseTotal = 0;
    currentPurchasePaid = 0;
    currentPurchaseBalance = 0;
    document.getElementById('amount_paid').value = '';
    
    const purchaseInfo = document.getElementById('purchase_info');
    if (purchaseInfo) {
        purchaseInfo.innerHTML = '';
    }
    
    const balanceRemaining = document.getElementById('balance_remaining');
    if (balanceRemaining) {
        balanceRemaining.innerHTML = '';
    }
    
    const quickAmounts = document.getElementById('quick_amounts');
    if (quickAmounts) {
        quickAmounts.innerHTML = '';
    }
}

function initializePaymentsTable() {
    if (!document.getElementById('paymentsTable')) return;
    
    loadPayments().then(payments => {
        paymentsTable = $('#paymentsTable').DataTable({
            data: payments,
            columns: [
                {
                    data: 'id',
                    render: function(data) {
                        return `<span class="fw-semibold">#${data}</span>`;
                    }
                },
                {
                    data: 'payment_date',
                    render: function(data) {
                        return formatDate(data);
                    }
                },
                { data: 'supplier_name' },
                {
                    data: 'purchase_id',
                    render: function(data, type, row) {
                        if (data) {
                            return `<a href="#" onclick="viewPurchase(${data}); return false;">#${data}</a>`;
                        }
                        return '<span class="text-muted">N/A</span>';
                    }
                },
                {
                    data: 'amount_paid',
                    render: function(data) {
                        return formatCurrency(data);
                    }
                },
                { 
                    data: 'payment_method',
                    render: function(data) {
                        return `<span class="badge bg-info">${escapeHtml(data)}</span>`;
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        if (data.receipt_path) {
                            return `<button class="btn btn-sm btn-outline-success" onclick="viewReceipt(${data.id})">
                                <i class="bi bi-file-earmark-pdf"></i> View
                            </button>`;
                        }
                        return '<span class="text-muted">No receipt</span>';
                    }
                },
                { 
                    data: 'notes',
                    render: function(data) {
                        return data || '<span class="text-muted">-</span>';
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
    
    // If we have a pre-selected purchase, show its info
    if (currentPurchaseId) {
        loadSelectedPurchaseDetails(currentPurchaseId);
    }
    
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
    
    // Reset purchase info
    const purchaseInfo = document.getElementById('purchase_info');
    if (purchaseInfo) purchaseInfo.innerHTML = '';
    
    const balanceRemaining = document.getElementById('balance_remaining');
    if (balanceRemaining) balanceRemaining.innerHTML = '';
    
    const quickAmounts = document.getElementById('quick_amounts');
    if (quickAmounts) quickAmounts.innerHTML = '';
    
    selectedFile = null;
    currentPurchaseId = null;
    currentPurchaseTotal = 0;
    currentPurchasePaid = 0;
    currentPurchaseBalance = 0;
}

async function savePayment() {
    const form = document.getElementById('paymentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const amountPaid = parseFloat(document.getElementById('amount_paid').value);
    
    // Validate amount doesn't exceed balance
    if (currentPurchaseId && amountPaid > currentPurchaseBalance) {
        Toast.error(`Amount cannot exceed balance of ${formatCurrency(currentPurchaseBalance)}`);
        return;
    }
    
    const formData = new FormData();
    formData.append('supplier_id', document.getElementById('supplier_id').value);
    formData.append('purchase_id', document.getElementById('purchase_id').value || '');
    formData.append('amount_paid', amountPaid);
    formData.append('payment_date', document.getElementById('payment_date').value);
    formData.append('payment_method', document.getElementById('payment_method').value);
    formData.append('notes', document.getElementById('notes').value);
    
    if (selectedFile) {
        formData.append('receipt', selectedFile);
    }
    
    try {
        const response = await API.upload('/payments', formData);
        
        // Show success message with payment status
        let statusMessage = 'Payment recorded successfully';
        if (currentPurchaseId) {
            if (amountPaid >= currentPurchaseBalance) {
                statusMessage = 'Payment recorded successfully! Purchase is now fully paid.';
            } else {
                const remaining = currentPurchaseBalance - amountPaid;
                statusMessage = `Payment recorded successfully! Remaining balance: ${formatCurrency(remaining)}`;
            }
        }
        
        Toast.success(statusMessage);
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        
        if (document.getElementById('paymentsTable')) {
            refreshTable();
        }
        
        // If we came from a purchase page, redirect back
        if (currentPurchaseId) {
            setTimeout(() => {
                window.location.href = `/purchases`;
            }, 2000);
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
            if (paymentsTable) {
                paymentsTable.clear();
                paymentsTable.rows.add(payments);
                paymentsTable.draw();
            }
        });
    } else {
        Toast.warning('Please select both start and end dates');
    }
}

function viewReceipt(paymentId) {
    if (!paymentId) {
        Toast.error('Invalid payment ID');
        return;
    }
    
    window.open(`/api/payments/${paymentId}/receipt`, '_blank');
}

function viewPurchase(purchaseId) {
    window.location.href = `/purchases?id=${purchaseId}`;
}

function refreshTable() {
    loadPayments().then(payments => {
        if (paymentsTable) {
            paymentsTable.clear();
            paymentsTable.rows.add(payments);
            paymentsTable.draw();
        }
    });
}

// Make functions globally available
window.openPaymentModal = openPaymentModal;
window.savePayment = savePayment;
window.viewReceipt = viewReceipt;
window.viewPurchase = viewPurchase;