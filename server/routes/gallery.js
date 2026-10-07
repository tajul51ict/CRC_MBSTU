const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadGallery } = require('../middleware/upload');

// Public route to view gallery
router.get('/', galleryController.getAllGallery);

// Admin routes for gallery management
router.post('/', authenticateToken, requireAdmin, uploadGallery.single('image'), galleryController.createGallery);
router.delete('/:id', authenticateToken, requireAdmin, galleryController.deleteGallery);

module.exports = router;
