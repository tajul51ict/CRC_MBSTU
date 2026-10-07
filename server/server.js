const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const memberRoutes = require('./routes/members');
const committeeRoutes = require('./routes/committee');
const galleryRoutes = require('./routes/gallery');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Serve frontend assets (HTML, CSS, JS) from project root
app.use(express.static(path.join(__dirname, '..')));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/gallery', galleryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRC MBSTU API is active and running.' });
});

// Friendly root fallback (serves index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Centralized safe error handler (prevents leaking sensitive DB / system errors)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CRC MBSTU Server running on http://localhost:${PORT}`);
  console.log(`📡 REST API mounted at http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
