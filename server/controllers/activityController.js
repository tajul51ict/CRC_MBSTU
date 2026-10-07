const db = require('../db');
const fs = require('fs');
const path = require('path');

// Helper to remove an uploaded image file if deleted/replaced
const removeOldImage = (imageName) => {
  if (!imageName) return;
  const filePath = path.join(__dirname, '../../uploads/activities', imageName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error deleting activity image:', e);
    }
  }
};

// GET all activities (with optional status filter or limit)
const getAllActivities = async (req, res) => {
  try {
    const { status, limit } = req.query;
    let sql = 'SELECT * FROM activities';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY date DESC, id DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const [rows] = await db.query(sql, params);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve activities.' });
  }
};

// GET single activity by ID
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM activities WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    const activity = rows[0];

    // If a user is logged in, also check if they already joined
    let isJoined = false;
    if (req.user) {
      const [reg] = await db.query(
        'SELECT id FROM registrations WHERE user_id = ? AND activity_id = ?',
        [req.user.id, id]
      );
      isJoined = reg.length > 0;
    }

    // Get count of registered participants
    const [countRows] = await db.query(
      'SELECT COUNT(*) as total_participants FROM registrations WHERE activity_id = ?',
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...activity,
        isJoined,
        participantsCount: countRows[0].total_participants
      }
    });
  } catch (error) {
    console.error('Error fetching activity details:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve activity details.' });
  }
};

// POST create activity (Admin only)
const createActivity = async (req, res) => {
  try {
    const { title, description, date, location, status } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required.' });
    }

    const image = req.file ? req.file.filename : null;

    const [result] = await db.query(
      `INSERT INTO activities (title, description, date, location, image, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description ? description.trim() : null,
        date,
        location ? location.trim() : null,
        image,
        status || 'upcoming'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Activity created successfully.',
      activityId: result.insertId
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return res.status(500).json({ success: false, message: 'Failed to create activity.' });
  }
};

// PUT update activity (Admin only)
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, status } = req.body;

    const [rows] = await db.query('SELECT * FROM activities WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    const existingActivity = rows[0];
    let image = existingActivity.image;

    // If new image uploaded, delete old one and update
    if (req.file) {
      image = req.file.filename;
      removeOldImage(existingActivity.image);
    }

    await db.query(
      `UPDATE activities
       SET title = ?, description = ?, date = ?, location = ?, image = ?, status = ?
       WHERE id = ?`,
      [
        title || existingActivity.title,
        description !== undefined ? description : existingActivity.description,
        date || existingActivity.date,
        location !== undefined ? location : existingActivity.location,
        image,
        status || existingActivity.status,
        id
      ]
    );

    return res.json({ success: true, message: 'Activity updated successfully.' });
  } catch (error) {
    console.error('Error updating activity:', error);
    return res.status(500).json({ success: false, message: 'Failed to update activity.' });
  }
};

// DELETE activity (Admin only)
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT image FROM activities WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    // Delete image file if exists
    removeOldImage(rows[0].image);

    await db.query('DELETE FROM activities WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Activity deleted successfully.' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete activity.' });
  }
};

// POST join activity (Member only)
const joinActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if activity exists
    const [actRows] = await db.query('SELECT id, title, status FROM activities WHERE id = ?', [id]);
    if (actRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    // Check if user already joined
    const [regRows] = await db.query(
      'SELECT id FROM registrations WHERE user_id = ? AND activity_id = ?',
      [userId, id]
    );

    if (regRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this activity!'
      });
    }

    // Insert registration
    await db.query(
      'INSERT INTO registrations (user_id, activity_id) VALUES (?, ?)',
      [userId, id]
    );

    return res.json({
      success: true,
      message: 'You have successfully joined the activity!'
    });
  } catch (error) {
    // Handle MySQL duplicate key error gracefully
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this activity!'
      });
    }
    console.error('Error joining activity:', error);
    return res.status(500).json({ success: false, message: 'Failed to join activity.' });
  }
};

// GET activities joined by the current logged-in member
const getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT a.*, r.registered_at
       FROM activities a
       JOIN registrations r ON a.id = r.activity_id
       WHERE r.user_id = ?
       ORDER BY r.registered_at DESC`,
      [userId]
    );

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching member activities:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your activities.' });
  }
};

module.exports = {
  getAllActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  joinActivity,
  getMyActivities
};
