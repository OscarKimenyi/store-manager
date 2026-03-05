const bcrypt = require('bcrypt');
const db = require('../config/database');

const authController = {
    login: async (req, res) => {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        try {
            const [users] = await db.query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            };
            
            res.json({ 
                message: 'Login successful',
                user: req.session.user 
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    },

    register: async (req, res) => {
        const { username, email, password, full_name } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        try {
            const [existing] = await db.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const [result] = await db.query(
                'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
                [username, email, hashedPassword, full_name || username, 'staff']
            );
            
            res.status(201).json({ 
                message: 'Registration successful',
                userId: result.insertId
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Server error during registration' });
        }
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ error: 'Failed to logout' });
            }
            res.clearCookie('inventory.sid');
            res.redirect('/');
        });
    },

    getCurrentUser: (req, res) => {
        if (req.session.user) {
            res.json(req.session.user);
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    }
};

module.exports = authController;