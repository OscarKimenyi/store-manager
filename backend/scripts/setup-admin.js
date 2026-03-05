const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

// Create connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function setupAdmin() {
    try {
        // Hash the password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Generated hash for password "admin123":', hashedPassword);
        
        // First, check if admin exists
        connection.query(
            'SELECT * FROM users WHERE username = ?',
            ['admin'],
            (err, results) => {
                if (err) throw err;
                
                if (results.length > 0) {
                    // Update existing admin
                    connection.query(
                        'UPDATE users SET password = ? WHERE username = ?',
                        [hashedPassword, 'admin'],
                        (err, result) => {
                            if (err) throw err;
                            console.log('Admin password updated successfully!');
                            console.log('You can now login with:');
                            console.log('Username: admin');
                            console.log('Password: admin123');
                            connection.end();
                        }
                    );
                } else {
                    // Insert new admin
                    connection.query(
                        'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
                        ['admin', 'admin@example.com', hashedPassword, 'System Administrator', 'admin'],
                        (err, result) => {
                            if (err) throw err;
                            console.log('Admin user created successfully!');
                            console.log('You can now login with:');
                            console.log('Username: admin');
                            console.log('Password: admin123');
                            connection.end();
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.error('Error setting up admin:', error);
        connection.end();
    }
}

setupAdmin();