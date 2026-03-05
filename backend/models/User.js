const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    static async findAll() {
        const [rows] = await db.query(
            'SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    }
    
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }
    
    static async findByUsername(username) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }
    
    static async create(userData) {
        const { username, email, password, full_name, role = 'staff' } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, role]
        );
        return result.insertId;
    }
    
    static async update(id, userData) {
        const { full_name, email, role } = userData;
        const [result] = await db.query(
            'UPDATE users SET full_name = ?, email = ?, role = ? WHERE id = ?',
            [full_name, email, role, id]
        );
        return result.affectedRows > 0;
    }
    
    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    }
    
    static async delete(id) {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;