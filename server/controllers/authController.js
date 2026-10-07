const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// Register a new member
const register = async (req, res) => {
  try {
    const { name, student_id, department, batch, email, password } = req.body;

    if (!name || !student_id || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if email or student_id already exists
    const [existing] = await db.query(
      'SELECT id, email, student_id FROM users WHERE email = ? OR student_id = ?',
      [email.trim().toLowerCase(), student_id.trim()]
    );

    if (existing.length > 0) {
      if (existing[0].email.toLowerCase() === email.trim().toLowerCase()) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      return res.status(400).json({ success: false, message: 'An account with this Student ID already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user with default role = 'member' and status = 'pending'
    await db.query(
      `INSERT INTO users (name, student_id, department, batch, email, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'member', 'pending')`,
      [
        name.trim(),
        student_id.trim(),
        department ? department.trim() : null,
        batch ? batch.trim() : null,
        email.trim().toLowerCase(),
        hashedPassword
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during registration. Please try again.' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    // Fetch user
    const [rows] = await db.query(
      'SELECT id, name, student_id, department, batch, email, password, role, status FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Status check for members
    if (user.role === 'member') {
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your registration is pending approval by the CRC Admin. Please wait for confirmation.'
        });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your registration was rejected. Please contact CRC MBSTU administration.'
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        role: user.role,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: false, // accessible to script for convenience
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const redirectUrl = user.role === 'admin' ? '/admin/dashboard.html' : '/member/dashboard.html';

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        student_id: user.student_id,
        department: user.department,
        batch: user.batch,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during login. Please try again.' });
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully.' });
};

// Get current user details
const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
