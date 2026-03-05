# Inventory Management System

A complete, professional, and modern web-based Inventory & Stock Management System.

## Features

### 🔐 Authentication System
- Secure login with session-based authentication
- Password hashing using bcrypt
- User roles (admin, manager, staff)
- Logout functionality

### 📊 Modern Dashboard
- Clean professional UI with Bootstrap 5
- Responsive design for all devices
- Real-time statistics cards
- Low stock alerts highlighted in red
- Charts for sales and stock analysis

### 📦 Product Management
- Full CRUD operations
- Search and filter by category
- Low stock indicators
- Soft delete functionality
- Form validation

### 🏷️ Category Management
- Manage product categories
- Category dropdown in product forms

### 🤝 Supplier Management
- Track supplier information
- View purchase history
- Contact details management

### 🛒 Purchases (Stock In)
- Automatic stock quantity updates
- Payment status tracking
- Date range filtering
- Supplier filtering

### 💰 Supplier Payments
- Partial payments support
- Receipt upload (images/PDF)
- Automatic balance calculation
- Payment history tracking

### 📈 Sales (Stock Out)
- Prevent overselling
- Automatic stock deduction
- Daily sales summary

### 📑 Reports Module
- Current Stock Report
- Low Stock Report
- Purchase Report
- Payment Report
- Unpaid Balances Report
- Sales Report
- Export to PDF

## Tech Stack

### Backend
- Node.js with Express.js
- MySQL database
- RESTful API architecture
- MVC pattern
- Session-based authentication
- Multer for file uploads

### Frontend
- HTML5
- CSS3 with modern design
- Bootstrap 5
- Vanilla JavaScript
- DataTables for advanced tables
- Chart.js for analytics
- Bootstrap Icons

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/inventory-management-system.git
cd inventory-management-system
```
### Step 2: Install Dependencies
```bash
cd backend
npm install
```

### Step 3: Database Setup
1. Create a MySQL database
2. Import the database schema:
```bash
mysql -u root -p inventory_system < database-schema.sql
```

### Step 4: Configure Environment
Create a .env file in the backend directory:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=inventory_system
SESSION_SECRET=your_super_secret_key
UPLOAD_PATH=../frontend/public/uploads/receipts
MAX_FILE_SIZE=5242880
NODE_ENV=development
```

### Step 5: Create Upload Directory
```bash
mkdir -p frontend/public/uploads/receipts
```

### Step 6: Start the Application
```bash
npm run dev
```

### Step 7: Access the Application
Open your browser and navigate to:
```text
http://localhost:3000
```

Default login credentials:
- Username: admin
- Password: admin123

### Project Structure
```text
inventory-system/
├── backend/
│   ├── config/         # Configuration files
│   ├── controllers/     # Business logic
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── .env           # Environment variables
│   └── app.js         # Main application file
├── frontend/
│   ├── public/         # Static assets
│   │   ├── css/       # Stylesheets
│   │   ├── js/        # JavaScript files
│   │   └── uploads/   # Uploaded files
│   └── views/         # HTML pages
├── database-schema.sql # Database schema
├── .gitignore
└── README.md
```

### API Endpoints

#### Authentication

- POST /api/auth/login - User login
- POST /api/auth/register - User registration
- GET /api/auth/logout - User logout
- GET /api/auth/me - Get current user

#### Categories

- GET /api/categories - Get all categories
- GET /api/categories/:id - Get single category
- POST /api/categories - Create category
- PUT /api/categories/:id - Update category
- DELETE /api/categories/:id - Delete category

#### Products

- GET /api/products - Get all products
- GET /api/products/low-stock - Get low stock products
- GET /api/products/:id - Get single product
- POST /api/products - Create product
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

#### Suppliers

- GET /api/suppliers - Get all suppliers
- GET /api/suppliers/:id - Get single supplier
- GET /api/suppliers/:id/history - Get supplier history
- POST /api/suppliers - Create supplier
- PUT /api/suppliers/:id - Update supplier
- DELETE /api/suppliers/:id - Delete supplier

#### Purchases

- GET /api/purchases - Get all purchases
- GET /api/purchases/range - Get purchases by date range
- GET /api/purchases/:id - Get single purchase
- POST /api/purchases - Create purchase
- PUT /api/purchases/:id - Update purchase
- DELETE /api/purchases/:id - Delete purchase

#### Payments

- GET /api/payments - Get all payments
- GET /api/payments/supplier/:supplierId - Get supplier payments
- GET /api/payments/:id - Get single payment
- GET /api/payments/:id/receipt - Get payment receipt
- POST /api/payments - Create payment (with file upload)

#### Sales

- GET /api/sales - Get all sales
- GET /api/sales/daily - Get daily sales
- GET /api/sales/monthly - Get monthly sales
- GET /api/sales/:id - Get single sale
- POST /api/sales - Create sale

#### Reports

- GET /api/reports/stock - Stock report
- GET /api/reports/low-stock - Low stock report
- GET /api/reports/purchases - Purchase report
- GET /api/reports/payments - Payment report
- GET /api/reports/unpaid-balances - Unpaid balances report
- GET /api/reports/sales - Sales report
- POST /api/reports/export/pdf - Export report to PDF


### Security Features

✅ Password hashing with bcrypt
✅ Session-based authentication
✅ SQL injection prevention (prepared statements)
✅ Input validation and sanitization
✅ File upload validation (type and size)
✅ XSS protection
✅ CSRF protection via sessions
✅ Secure HTTP headers with Helmet


### Business Rules

- Cannot sell more than available stock
- Cannot delete payment records (audit trail)
- Automatic balance calculation
- Stock updates on purchase and sale
- Low stock alerts when quantity <= minimum level
- Full transaction history preserved


### Contributing

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

### License

This project is licensed under the MIT License.