const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authenticateToken, requireAdmin, requireMember } = require('../middleware/auth');

// Dashboard statistics
router.get('/admin-stats', authenticateToken, requireAdmin, memberController.getAdminStats);
router.get('/member-stats', authenticateToken, requireMember, memberController.getMemberStats);

// Admin member management routes
router.get('/', authenticateToken, requireAdmin, memberController.getAllMembers);
router.put('/:id/approve', authenticateToken, requireAdmin, memberController.approveMember);
router.put('/:id/reject', authenticateToken, requireAdmin, memberController.rejectMember);

module.exports = router;
