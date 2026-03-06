function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

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
        currentSupplierId = supplierId;
        loadSupplierDetails(supplierId);
    }
});

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            if (suppliersTable) {
                suppliersTable.search(this.value).draw();
            }
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
                { 
                    data: 'phone',
                    render: function(data) {
                        return data || '<span class="text-muted">N/A</span>';
                    }
                },
                { 
                    data: 'email',
                    render: function(data) {
                        return data || '<span class="text-muted">N/A</span>';
                    }
                },
                { 
                    data: 'address',
                    render: function(data) {
                        return data || '<span class="text-muted">N/A</span>';
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <button class="btn btn-sm btn-outline-info me-1" onclick="viewSupplier(${data.id})" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editSupplier(${data.id})" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="showDeleteModal(${data.id})" title="Delete">
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

// New function to handle edit from details page
function editSupplierFromDetails() {
    if (currentSupplierId) {
        editSupplier(currentSupplierId);
    }
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
            // Update the displayed supplier info
            displaySupplierInfo({
                name: supplierData.name,
                phone: supplierData.phone,
                email: supplierData.email,
                address: supplierData.address
            });
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
        Spinner.show();
        const data = await API.get(`/suppliers/${id}/history`);
        console.log('Supplier data loaded:', data); // Debug log
        
        displaySupplierInfo(data.supplier);
        displaySupplierPurchases(data.purchases || []);
        displaySupplierPayments(data.payments || []);
        updateSupplierStats(data);
        
        currentSupplierId = id;
    } catch (error) {
        console.error('Failed to load supplier details:', error);
        Toast.error('Failed to load supplier details');
    } finally {
        Spinner.hide();
    }
}

function displaySupplierInfo(supplier) {
    if (!supplier) return;
    
    document.getElementById('supplierName').textContent = supplier.name || 'N/A';
    
    const phoneElement = document.getElementById('supplierPhone');
    if (supplier.phone) {
        phoneElement.innerHTML = `<i class="bi bi-telephone me-2"></i>${supplier.phone}`;
    } else {
        phoneElement.innerHTML = '<span class="text-muted"><i class="bi bi-telephone me-2"></i>No phone</span>';
    }
    
    const emailElement = document.getElementById('supplierEmail');
    if (supplier.email) {
        emailElement.innerHTML = `<i class="bi bi-envelope me-2"></i>${supplier.email}`;
    } else {
        emailElement.innerHTML = '<span class="text-muted"><i class="bi bi-envelope me-2"></i>No email</span>';
    }
    
    const addressElement = document.getElementById('supplierAddress');
    if (supplier.address) {
        addressElement.innerHTML = `<i class="bi bi-geo-alt me-2"></i>${supplier.address}`;
    } else {
        addressElement.innerHTML = '<span class="text-muted"><i class="bi bi-geo-alt me-2"></i>No address</span>';
    }
}

function updateSupplierStats(data) {
    const purchases = data.purchases || [];
    const payments = data.payments || [];
    
    // Calculate totals
    const totalPurchases = purchases.length;
    const totalPurchaseAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
    const balance = totalPurchaseAmount - totalPaid;
    
    document.getElementById('totalPurchases').textContent = formatNumber(totalPurchases);
    document.getElementById('totalPurchaseAmount').textContent = formatCurrency(totalPurchaseAmount);
    document.getElementById('totalPaidAmount').textContent = formatCurrency(totalPaid);
    document.getElementById('balanceAmount').textContent = formatCurrency(balance);
}

function displaySupplierPurchases(purchases) {
    const tbody = document.getElementById('purchasesTableBody');
    if (!tbody) return;
    
    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No purchases found</td></tr>';
        return;
    }
    
    tbody.innerHTML = purchases.map(purchase => {
        // Check if payment is complete - only show pay button if NOT paid
        const isPaid = purchase.payment_status === 'Paid';
        const balance = parseFloat(purchase.balance || purchase.total_amount - (purchase.total_paid || 0));
        
        return `
            <tr>
                <td>${formatDateOnly(purchase.purchase_date)}</td>
                <td>${escapeHtml(purchase.product_name || 'N/A')}</td>
                <td>${formatNumber(purchase.quantity || 0)}</td>
                <td>${formatCurrency(purchase.unit_price || 0)}</td>
                <td>${formatCurrency(purchase.total_amount || 0)}</td>
                <td>${getStatusBadge(purchase.payment_status || 'Unpaid')}</td>
                <td>
                    ${!isPaid ? 
                        `<button class="btn btn-sm btn-outline-primary" onclick="makePayment(${purchase.id}, ${purchase.supplier_id})">
                            <i class="bi bi-cash"></i> Pay (${formatCurrency(balance)})
                        </button>` : 
                        '<span class="text-muted">-</span>'
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function displaySupplierPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No payments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>${formatDateOnly(payment.payment_date)}</td>
            <td>${payment.purchase_id ? `#${payment.purchase_id}` : 'N/A'}</td>
            <td>${formatCurrency(payment.amount_paid || 0)}</td>
            <td>
                ${payment.receipt_path ? 
                    `<button class="btn btn-sm btn-outline-success" onclick="viewReceipt('${payment.receipt_path}', ${payment.id})">
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

function makePayment(purchaseId, supplierId) {
    if (purchaseId) {
        window.location.href = `/payments?purchase=${purchaseId}`;
    } else if (supplierId) {
        window.location.href = `/payments?supplier=${supplierId}`;
    }
}

function viewReceipt(paymentId) {
    if (!paymentId) {
        Toast.error('Invalid payment ID');
        return;
    }
    
    console.log('Viewing receipt for payment ID:', paymentId); // Debug log
    
    // Navigate to the receipt URL using the payment ID
    const receiptUrl = `/api/payments/${paymentId}/receipt`;
    console.log('Opening URL:', receiptUrl); // Debug log
    
    window.open(receiptUrl, '_blank');
}

function refreshTable() {
    loadSuppliers().then(suppliers => {
        if (suppliersTable) {
            suppliersTable.clear();
            suppliersTable.rows.add(suppliers);
            suppliersTable.draw();
        }
    });
}

// Make functions globally available
window.openSupplierModal = openSupplierModal;
window.editSupplier = editSupplier;
window.editSupplierFromDetails = editSupplierFromDetails;
window.saveSupplier = saveSupplier;
window.viewSupplier = viewSupplier;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.makePayment = makePayment;
window.viewReceipt = viewReceipt;