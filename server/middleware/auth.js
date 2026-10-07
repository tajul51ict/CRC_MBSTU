const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'crc_mbstu_super_secret_jwt_key_2026';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists in database and get latest status
    const [rows] = await db.query('SELECT id, name, email, student_id, department, batch, role, status FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = rows[0];

    // If user is rejected
    if (user.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your account has been rejected by the administrator.' });
    }

    // If user is pending and not admin
    if (user.role === 'member' && user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

// Middleware to restrict access to Admins only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

// Middleware to restrict access to Active Members
const requireMember = (req, res, next) => {
  if (!req.user || (req.user.role !== 'member' && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Access denied. Member privileges required.' });
  }
  if (req.user.role === 'member' && req.user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Your membership is not active yet.' });
  }
  next();
};

// Middleware to optionally attach user if token exists (does not block if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const [rows] = await db.query('SELECT id, name, email, student_id, department, batch, role, status FROM users WHERE id = ?', [decoded.id]);
      if (rows.length > 0) {
        req.user = rows[0];
      }
    }
  } catch (e) {
    // ignore invalid token for optional auth
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireMember,
  JWT_SECRET
};
