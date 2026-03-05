// Global Variables
let currentUser = null;

// Document Ready
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeUserMenu();
    checkAuthentication();
    initializeTooltips();
    setActiveMenu();
});

// Sidebar Functions
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mainContent = document.getElementById('mainContent');
    const mobileToggle = document.getElementById('mobileToggle');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            // Update toggle icon
            const icon = toggleBtn.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.className = 'bi bi-chevron-right';
            } else {
                icon.className = 'bi bi-chevron-left';
            }
        });
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            const isClickInside = sidebar?.contains(event.target) || mobileToggle?.contains(event.target);
            if (!isClickInside && sidebar?.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
}

// User Menu
function initializeUserMenu() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Authentication
async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            currentUser = await response.json();
            updateUserInfo();
        } else if (!window.location.pathname.includes('/login') && 
                   !window.location.pathname.includes('/register')) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

function updateUserInfo() {
    const userNameElements = document.querySelectorAll('.user-name');
    const userRoleElements = document.querySelectorAll('.user-role');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    
    if (currentUser) {
        const displayName = currentUser.full_name || currentUser.username;
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        
        userNameElements.forEach(el => {
            el.textContent = displayName;
        });
        
        userRoleElements.forEach(el => {
            el.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        });
        
        userAvatarElements.forEach(el => {
            el.textContent = initials.substring(0, 2);
        });
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Active Menu
function setActiveMenu() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPath) {
            item.classList.add('active');
        } else if (currentPath === '/' && href === '/dashboard') {
            // Don't mark dashboard as active on login page
        } else {
            item.classList.remove('active');
        }
    });
}

// Toast Notification System
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'success', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Choose icon based on type
        let icon = 'bi-check-circle';
        if (type === 'error') icon = 'bi-exclamation-circle';
        if (type === 'warning') icon = 'bi-exclamation-triangle';
        if (type === 'info') icon = 'bi-info-circle';
        
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${icon} me-2 fs-5"></i>
                <div class="flex-grow-1">${message}</div>
                <button class="btn-close btn-close-white ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
            if (this.container.children.length === 0) {
                this.container.remove();
                this.container = null;
            }
        }, duration);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error');
    },
    
    warning(message) {
        this.show(message, 'warning');
    },
    
    info(message) {
        this.show(message, 'info');
    }
};

// Loading Spinner
const Spinner = {
    overlay: null,
    
    init() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'spinner-overlay';
            this.overlay.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(this.overlay);
        }
    },
    
    show() {
        this.init();
        this.overlay.style.display = 'flex';
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
};

// API Service
const API = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        };
        
        const fetchOptions = { ...defaultOptions, ...options };
        
        try {
            Spinner.show();
            const response = await fetch(url, fetchOptions);
            
            if (response.status === 401) {
                window.location.href = '/';
                throw new Error('Unauthorized');
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }
            
            return await response.json();
        } catch (error) {
            Toast.error(error.message);
            throw error;
        } finally {
            Spinner.hide();
        }
    },
    
    get(endpoint) {
        return this.request(endpoint);
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },
    
    async upload(endpoint, formData) {
        const url = this.baseURL + endpoint;
        
        try {
            Spinner.show();
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (response.status === 401) {
                window.location.href = '/';
                throw new Error('Unauthorized');
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            return await response.json();
        } catch (error) {
            Toast.error(error.message);
            throw error;
        } finally {
            Spinner.hide();
        }
    }
};

// Utility Functions
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getStatusBadge(status) {
    const badges = {
        'Paid': '<span class="badge-success">Paid</span>',
        'Partial': '<span class="badge-warning">Partial</span>',
        'Unpaid': '<span class="badge-danger">Unpaid</span>',
        'Active': '<span class="badge-success">Active</span>',
        'Inactive': '<span class="badge-danger">Inactive</span>'
    };
    return badges[status] || `<span class="badge-secondary">${status}</span>`;
}

// Export for use in other files
window.Toast = Toast;
window.Spinner = Spinner;
window.API = API;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.escapeHtml = escapeHtml;
window.getStatusBadge = getStatusBadge;