const db = require('../config/database');

async function testPaymentIds() {
    try {
        console.log('Testing payment IDs...');
        
        // Get all payments
        const [payments] = await db.query('SELECT id, receipt_path FROM supplier_payments');
        
        console.log(`Found ${payments.length} payments in database:`);
        payments.forEach(payment => {
            console.log(`  Payment ID: ${payment.id}, Receipt: ${payment.receipt_path || 'None'}`);
        });
        
        // Test each payment ID
        for (const payment of payments) {
            console.log(`\nTesting payment ID ${payment.id}...`);
            
            const [result] = await db.query(
                'SELECT * FROM supplier_payments WHERE id = ?',
                [payment.id]
            );
            
            if (result.length > 0) {
                console.log(`  ✅ Payment ${payment.id} exists`);
                console.log(`  Receipt path: ${result[0].receipt_path}`);
            } else {
                console.log(`  ❌ Payment ${payment.id} not found`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testPaymentIds();