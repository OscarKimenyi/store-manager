const db = require('../config/database');
const bcrypt = require('bcrypt');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test query
        const [result] = await db.query('SELECT 1 + 1 as solution');
        console.log('Database connection successful:', result[0].solution === 2);
        
        // Check users table
        const [tables] = await db.query('SHOW TABLES LIKE "users"');
        if (tables.length === 0) {
            console.error('Users table does not exist!');
            return;
        }
        
        // Check users
        const [users] = await db.query('SELECT id, username, email, role FROM users');
        console.log('Users in database:', users);
        
        if (users.length === 0) {
            console.log('No users found. Creating default admin user...');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const [result] = await db.query(
                'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
                ['admin', 'admin@example.com', hashedPassword, 'System Administrator', 'admin']
            );
            
            console.log('Default admin user created with ID:', result.insertId);
            console.log('Username: admin');
            console.log('Password: admin123');
        } else {
            // Verify admin password
            const [admin] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
            if (admin.length > 0) {
                const testPassword = await bcrypt.compare('admin123', admin[0].password);
                console.log('Admin password "admin123" is valid:', testPassword);
                
                if (!testPassword) {
                    console.log('Updating admin password...');
                    const newHash = await bcrypt.hash('admin123', 10);
                    await db.query('UPDATE users SET password = ? WHERE username = ?', [newHash, 'admin']);
                    console.log('Admin password updated successfully');
                }
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Database test failed:', error);
        process.exit(1);
    }
}

testDatabase();