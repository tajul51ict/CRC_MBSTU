const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateToken, requireAdmin, requireMember, optionalAuth } = require('../middleware/auth');
const { uploadActivity } = require('../middleware/upload');

// Public route to list activities
router.get('/', activityController.getAllActivities);

// Member route to list activities they have joined
router.get('/my-registered', authenticateToken, requireMember, activityController.getMyActivities);

// Single activity route (with optional auth to detect if logged in user already joined)
router.get('/:id', optionalAuth, activityController.getActivityById);

// Member join activity
router.post('/:id/join', authenticateToken, requireMember, activityController.joinActivity);

// Admin routes for activity management
router.post('/', authenticateToken, requireAdmin, uploadActivity.single('image'), activityController.createActivity);
router.put('/:id', authenticateToken, requireAdmin, uploadActivity.single('image'), activityController.updateActivity);
router.delete('/:id', authenticateToken, requireAdmin, activityController.deleteActivity);

module.exports = router;
