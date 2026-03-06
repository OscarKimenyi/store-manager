// Categories Management Module
let categoriesTable;
let deleteCategoryId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeCategoriesTable();
    initializeEventListeners();
});

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            categoriesTable.search(this.value).draw();
        });
    }
}

function initializeCategoriesTable() {
    if (!document.getElementById('categoriesTable')) return;
    
    loadCategories().then(categories => {
        categoriesTable = $('#categoriesTable').DataTable({
            data: categories,
            columns: [
                { data: 'name' },
                { 
                    data: 'description',
                    render: function(data) {
                        return data || '<span class="text-muted">No description</span>';
                    }
                },
                {
                    data: 'created_at',
                    render: function(data) {
                        return formatDate(data);
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editCategory(${data.id})">
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
                searchPlaceholder: "Search categories..."
            }
        });
    });
}

async function loadCategories() {
    try {
        const categories = await API.get('/categories');
        return categories;
    } catch (error) {
        console.error('Failed to load categories:', error);
        Toast.error('Failed to load categories');
        return [];
    }
}

function openCategoryModal() {
    resetCategoryForm();
    document.getElementById('modalTitle').textContent = 'Add Category';
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
}

function resetCategoryForm() {
    document.getElementById('categoryId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('description').value = '';
}

function editCategory(id) {
    API.get(`/categories/${id}`).then(category => {
        document.getElementById('modalTitle').textContent = 'Edit Category';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('name').value = category.name;
        document.getElementById('description').value = category.description || '';
        
        new bootstrap.Modal(document.getElementById('categoryModal')).show();
    }).catch(error => {
        Toast.error('Failed to load category details');
    });
}

function saveCategory() {
    const form = document.getElementById('categoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const categoryData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value
    };
    
    const categoryId = document.getElementById('categoryId').value;
    const method = categoryId ? 'put' : 'post';
    const endpoint = categoryId ? `/categories/${categoryId}` : '/categories';
    
    API[method](endpoint, categoryData).then(() => {
        Toast.success(categoryId ? 'Category updated successfully' : 'Category added successfully');
        bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
        refreshTable();
    }).catch(error => {
        Toast.error('Failed to save category');
    });
}

function showDeleteModal(id) {
    deleteCategoryId = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function confirmDelete() {
    if (deleteCategoryId) {
        API.delete(`/categories/${deleteCategoryId}`).then(() => {
            Toast.success('Category deleted successfully');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            refreshTable();
        }).catch(error => {
            if (error.message.includes('referenced')) {
                Toast.error('Cannot delete category with existing products');
            } else {
                Toast.error('Failed to delete category');
            }
        });
    }
}

function refreshTable() {
    loadCategories().then(categories => {
        categoriesTable.clear();
        categoriesTable.rows.add(categories);
        categoriesTable.draw();
    });
}

// Export functions for global access
window.openCategoryModal = openCategoryModal;
window.editCategory = editCategory;
window.saveCategory = saveCategory;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;