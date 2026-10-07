const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadCommittee } = require('../middleware/upload');

// Public route to view committee
router.get('/', committeeController.getAllCommittee);

// Admin routes for committee management
router.post('/', authenticateToken, requireAdmin, uploadCommittee.single('photo'), committeeController.createCommittee);
router.put('/:id', authenticateToken, requireAdmin, uploadCommittee.single('photo'), committeeController.updateCommittee);
router.delete('/:id', authenticateToken, requireAdmin, committeeController.deleteCommittee);

module.exports = router;
