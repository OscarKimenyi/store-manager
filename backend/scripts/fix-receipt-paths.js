const db = require('../config/database');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function fixReceiptPaths() {
    try {
        console.log('Checking receipt paths in database...');
        
        // Get all payments with receipts
        const [payments] = await db.query(
            'SELECT id, receipt_path FROM supplier_payments WHERE receipt_path IS NOT NULL'
        );
        
        console.log(`Found ${payments.length} payments with receipts`);
        
        // Get the correct upload directory
        const projectRoot = path.resolve(__dirname, '../../');
        const correctUploadDir = path.join(projectRoot, 'frontend', 'public', 'uploads', 'receipts');
        console.log('Correct upload directory:', correctUploadDir);
        
        let updatedCount = 0;
        
        for (const payment of payments) {
            const oldPath = payment.receipt_path;
            
            // Extract just the filename from the old path
            const filename = path.basename(oldPath);
            
            // Create the correct relative path
            const correctPath = path.join('frontend', 'public', 'uploads', 'receipts', filename).replace(/\\/g, '/');
            
            console.log(`\nPayment #${payment.id}:`);
            console.log(`  Old path: ${oldPath}`);
            console.log(`  New path: ${correctPath}`);
            
            // Check if file exists in the correct location
            const fullPath = path.join(projectRoot, correctPath);
            if (fs.existsSync(fullPath)) {
                console.log(`  ✅ File exists at correct location`);
                
                // Update the database with the correct path
                await db.query(
                    'UPDATE supplier_payments SET receipt_path = ? WHERE id = ?',
                    [correctPath, payment.id]
                );
                
                console.log(`  ✅ Database updated`);
                updatedCount++;
            } else {
                console.log(`  ❌ File not found at: ${fullPath}`);
                
                // Try to find the file elsewhere
                const possibleLocations = [
                    path.join(projectRoot, 'backend', 'uploads', 'receipts', filename),
                    path.join(projectRoot, 'uploads', 'receipts', filename),
                    path.join(projectRoot, 'public', 'uploads', 'receipts', filename)
                ];
                
                for (const loc of possibleLocations) {
                    if (fs.existsSync(loc)) {
                        console.log(`  ✅ Found file at: ${loc}`);
                        
                        // Create the correct directory if it doesn't exist
                        if (!fs.existsSync(correctUploadDir)) {
                            fs.mkdirSync(correctUploadDir, { recursive: true });
                        }
                        
                        // Copy the file to the correct location
                        fs.copyFileSync(loc, fullPath);
                        console.log(`  ✅ Copied to correct location`);
                        
                        // Update the database
                        await db.query(
                            'UPDATE supplier_payments SET receipt_path = ? WHERE id = ?',
                            [correctPath, payment.id]
                        );
                        
                        console.log(`  ✅ Database updated`);
                        updatedCount++;
                        break;
                    }
                }
            }
        }
        
        console.log(`\n✅ Fixed ${updatedCount} out of ${payments.length} receipt paths`);
        process.exit(0);
        
    } catch (error) {
        console.error('Error fixing receipt paths:', error);
        process.exit(1);
    }
}

fixReceiptPaths();