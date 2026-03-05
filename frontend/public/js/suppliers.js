// Suppliers Management Module
let suppliersTable;
let deleteSupplierId = null;
let currentSupplierId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeSuppliersTable();
    initializeEventListeners();
    
    // Check if we're on supplier details page
    const urlParams = new URLSearchParams(window.location.search);
    const supplierId = urlParams.get('id');
    if (supplierId) {
        loadSupplierDetails(supplierId);
    }
});

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            suppliersTable.search(this.value).draw();
        });
    }
    
    // Date range filters
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            loadSupplierHistory(currentSupplierId);
        });
    }
}

function initializeSuppliersTable() {
    if (!document.getElementById('suppliersTable')) return;
    
    loadSuppliers().then(suppliers => {
        suppliersTable = $('#suppliersTable').DataTable({
            data: suppliers,
            columns: [
                { data: 'name' },
                { data: 'phone' },
                { data: 'email' },
                { data: 'address' },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <button class="btn btn-sm btn-outline-info me-1" onclick="viewSupplier(${data.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editSupplier(${data.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="showDeleteModal(${data.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        `;
                    }
                }
            ],
            order: [[0, 'asc']],
            pageLength: 10,
            language: {
                search: "",
                searchPlaceholder: "Search suppliers..."
            }
        });
    });
}

async function loadSuppliers() {
    try {
        const suppliers = await API.get('/suppliers');
        return suppliers;
    } catch (error) {
        console.error('Failed to load suppliers:', error);
        Toast.error('Failed to load suppliers');
        return [];
    }
}

function openSupplierModal() {
    resetSupplierForm();
    document.getElementById('modalTitle').textContent = 'Add Supplier';
    new bootstrap.Modal(document.getElementById('supplierModal')).show();
}

function resetSupplierForm() {
    document.getElementById('supplierId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('address').value = '';
}

function editSupplier(id) {
    API.get(`/suppliers/${id}`).then(supplier => {
        document.getElementById('modalTitle').textContent = 'Edit Supplier';
        document.getElementById('supplierId').value = supplier.id;
        document.getElementById('name').value = supplier.name;
        document.getElementById('phone').value = supplier.phone || '';
        document.getElementById('email').value = supplier.email || '';
        document.getElementById('address').value = supplier.address || '';
        
        new bootstrap.Modal(document.getElementById('supplierModal')).show();
    }).catch(error => {
        Toast.error('Failed to load supplier details');
    });
}

function saveSupplier() {
    const form = document.getElementById('supplierForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const supplierData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value
    };
    
    const supplierId = document.getElementById('supplierId').value;
    const method = supplierId ? 'put' : 'post';
    const endpoint = supplierId ? `/suppliers/${supplierId}` : '/suppliers';
    
    API[method](endpoint, supplierData).then(() => {
        Toast.success(supplierId ? 'Supplier updated successfully' : 'Supplier added successfully');
        bootstrap.Modal.getInstance(document.getElementById('supplierModal')).hide();
        
        if (document.getElementById('suppliersTable')) {
            refreshTable();
        } else if (supplierId) {
            // Reload supplier details page
            loadSupplierDetails(supplierId);
        }
    }).catch(error => {
        Toast.error('Failed to save supplier');
    });
}

function viewSupplier(id) {
    window.location.href = `/suppliers?id=${id}`;
}

async function loadSupplierDetails(id) {
    try {
        const data = await API.get(`/suppliers/${id}/history`);
        displaySupplierInfo(data.supplier);
        displaySupplierPurchases(data.purchases);
        displaySupplierPayments(data.payments);
        updateSupplierStats(data);
        
        currentSupplierId = id;
    } catch (error) {
        console.error('Failed to load supplier details:', error);
        Toast.error('Failed to load supplier details');
    }
}

function displaySupplierInfo(supplier) {
    document.getElementById('supplierName').textContent = supplier.name;
    document.getElementById('supplierPhone').innerHTML = supplier.phone ? 
        `<i class="bi bi-telephone me-2"></i>${supplier.phone}` : 
        '<span class="text-muted">No phone</span>';
    document.getElementById('supplierEmail').innerHTML = supplier.email ? 
        `<i class="bi bi-envelope me-2"></i>${supplier.email}` : 
        '<span class="text-muted">No email</span>';
    document.getElementById('supplierAddress').innerHTML = supplier.address ? 
        `<i class="bi bi-geo-alt me-2"></i>${supplier.address}` : 
        '<span class="text-muted">No address</span>';
}

function updateSupplierStats(data) {
    document.getElementById('totalPurchases').textContent = formatNumber(data.purchases.length);
    document.getElementById('totalPurchaseAmount').textContent = formatCurrency(data.totalPurchases);
    document.getElementById('totalPaidAmount').textContent = formatCurrency(data.totalPaid);
    document.getElementById('balanceAmount').textContent = formatCurrency(data.totalPurchases - data.totalPaid);
}

function displaySupplierPurchases(purchases) {
    const tbody = document.getElementById('purchasesTableBody');
    if (!tbody) return;
    
    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No purchases found</td></tr>';
        return;
    }
    
    tbody.innerHTML = purchases.map(purchase => `
        <tr>
            <td>${formatDate(purchase.purchase_date)}</td>
            <td>${escapeHtml(purchase.product_name)}</td>
            <td>${formatNumber(purchase.quantity)}</td>
            <td>${formatCurrency(purchase.unit_price)}</td>
            <td>${formatCurrency(purchase.total_amount)}</td>
            <td>${getStatusBadge(purchase.payment_status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="makePayment(${purchase.id})">
                    <i class="bi bi-cash"></i> Pay
                </button>
            </td>
        </tr>
    `).join('');
}

function displaySupplierPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No payments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>${formatDate(payment.payment_date)}</td>
            <td>#${payment.purchase_id || 'N/A'}</td>
            <td>${formatCurrency(payment.amount_paid)}</td>
            <td><span class="badge bg-info">${escapeHtml(payment.payment_method)}</span></td>
            <td>
                ${payment.receipt_path ? 
                    `<button class="btn btn-sm btn-outline-success" onclick="viewReceipt('${payment.receipt_path}')">
                        <i class="bi bi-file-earmark-pdf"></i> View
                    </button>` : 
                    '<span class="text-muted">No receipt</span>'
                }
            </td>
            <td>${escapeHtml(payment.notes || '')}</td>
        </tr>
    `).join('');
}

function showDeleteModal(id) {
    deleteSupplierId = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function confirmDelete() {
    if (deleteSupplierId) {
        API.delete(`/suppliers/${deleteSupplierId}`).then(() => {
            Toast.success('Supplier deleted successfully');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            
            if (document.getElementById('suppliersTable')) {
                refreshTable();
            } else {
                window.location.href = '/suppliers';
            }
        }).catch(error => {
            Toast.error('Failed to delete supplier');
        });
    }
}

function makePayment(purchaseId) {
    window.location.href = `/payments?purchase=${purchaseId}`;
}

function viewReceipt(path) {
    window.open('/' + path, '_blank');
}

function refreshTable() {
    loadSuppliers().then(suppliers => {
        suppliersTable.clear();
        suppliersTable.rows.add(suppliers);
        suppliersTable.draw();
    });
}

// Export functions
window.openSupplierModal = openSupplierModal;
window.editSupplier = editSupplier;
window.saveSupplier = saveSupplier;
window.viewSupplier = viewSupplier;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.makePayment = makePayment;
window.viewReceipt = viewReceipt;