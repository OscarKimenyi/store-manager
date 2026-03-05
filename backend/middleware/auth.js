module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.session && req.session.user) {
            return next();
        }
        
        // Check if it's an API request
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Redirect to login page
        res.redirect('/');
    },
    
    isAdmin: (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === 'admin') {
            return next();
        }
        
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(403).json({ error: 'Forbidden - Admin access required' });
        }
        
        res.status(403).send('Access denied');
    }
};