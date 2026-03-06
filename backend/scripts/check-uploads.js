const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

function checkUploadDirectory() {
    console.log('Checking upload directory configuration...');
    
    // Get upload path from env
    const uploadPath = process.env.UPLOAD_PATH || '../frontend/public/uploads/receipts';
    console.log('Upload path from env:', uploadPath);
    
    // Resolve the absolute path
    const absolutePath = path.resolve(__dirname, '..', uploadPath);
    console.log('Absolute path:', absolutePath);
    
    // Check if directory exists
    if (fs.existsSync(absolutePath)) {
        console.log('✅ Upload directory exists');
        
        // List files in directory
        const files = fs.readdirSync(absolutePath);
        console.log(`Files in upload directory: ${files.length}`);
        files.forEach(file => {
            console.log(`  - ${file}`);
        });
    } else {
        console.log('❌ Upload directory does not exist');
        console.log('Creating upload directory...');
        
        try {
            fs.mkdirSync(absolutePath, { recursive: true });
            console.log('✅ Upload directory created successfully');
        } catch (error) {
            console.error('Failed to create upload directory:', error);
        }
    }
    
    // Check database for receipts
    const db = require('../config/database');
    db.query('SELECT id, receipt_path FROM supplier_payments WHERE receipt_path IS NOT NULL')
        .then(([rows]) => {
            console.log('\nPayments with receipts in database:', rows.length);
            rows.forEach(row => {
                console.log(`  Payment #${row.id}: ${row.receipt_path}`);
                
                // Check if file exists
                const filePath = path.resolve(__dirname, '../../', row.receipt_path);
                if (fs.existsSync(filePath)) {
                    console.log(`    ✅ File exists at: ${filePath}`);
                } else {
                    console.log(`    ❌ File missing at: ${filePath}`);
                }
            });
            
            process.exit(0);
        })
        .catch(error => {
            console.error('Database query failed:', error);
            process.exit(1);
        });
}

checkUploadDirectory();