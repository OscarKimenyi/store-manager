let productsTable;
let deleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadProducts();
    initializeEventListeners();
});

function initializeEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('keyup', function() {
        productsTable.search(this.value).draw();
    });
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', function() {
        productsTable.column(1).search(this.value).draw();
    });
}

async function loadCategories() {
    try {
        const categories = await API.get('/categories');
        const categorySelects = ['#category_id', '#categoryFilter'];
        
        categorySelects.forEach(selector => {
            const select = document.querySelector(selector);
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>' + 
                    categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
            }
        });
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadProducts() {
    try {
        const products = await API.get('/products');
        
        productsTable = $('#productsTable').DataTable({
            data: products,
            columns: [
                { data: 'name' },
                { data: 'category_name' },
                { data: 'size' },
                { data: 'unit_type' },
                { 
                    data: 'buying_price',
                    render: function(data) {
                        return `$${formatNumber(data)}`;
                    }
                },
                { 
                    data: 'selling_price',
                    render: function(data) {
                        return `$${formatNumber(data)}`;
                    }
                },
                { data: 'quantity' },
                { data: 'min_stock_level' },
                {
                    data: null,
                    render: function(data) {
                        if (data.quantity <= data.min_stock_level) {
                            return '<span class="badge-low-stock">Low Stock</span>';
                        }
                        return '<span class="badge bg-success">In Stock</span>';
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${data.id})">
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
                searchPlaceholder: "Search..."
            }
        });
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function editProduct(id) {
    API.get(`/products/${id}`).then(product => {
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('name').value = product.name;
        document.getElementById('size').value = product.size || '';
        document.getElementById('unit_type').value = product.unit_type;
        document.getElementById('buying_price').value = product.buying_price;
        document.getElementById('selling_price').value = product.selling_price;
        document.getElementById('quantity').value = product.quantity;
        document.getElementById('min_stock_level').value = product.min_stock_level;
        document.getElementById('category_id').value = product.category_id;
        
        new bootstrap.Modal(document.getElementById('productModal')).show();
    });
}

function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const productData = {
        name: document.getElementById('name').value,
        size: document.getElementById('size').value,
        unit_type: document.getElementById('unit_type').value,
        buying_price: document.getElementById('buying_price').value,
        selling_price: document.getElementById('selling_price').value,
        quantity: document.getElementById('quantity').value,
        min_stock_level: document.getElementById('min_stock_level').value,
        category_id: document.getElementById('category_id').value
    };
    
    const productId = document.getElementById('productId').value;
    const method = productId ? 'put' : 'post';
    const endpoint = productId ? `/products/${productId}` : '/products';
    
    API[method](endpoint, productData).then(() => {
        Toast.success(productId ? 'Product updated successfully' : 'Product added successfully');
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        resetForm();
        productsTable.destroy();
        loadProducts();
    }).catch(error => {
        Toast.error('Failed to save product');
    });
}

function showDeleteModal(id) {
    deleteId = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function confirmDelete() {
    if (deleteId) {
        API.delete(`/products/${deleteId}`).then(() => {
            Toast.success('Product deleted successfully');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            productsTable.destroy();
            loadProducts();
        }).catch(error => {
            Toast.error('Failed to delete product');
        });
    }
}

function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
}