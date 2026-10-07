const db = require('../db');
const fs = require('fs');
const path = require('path');

// Helper to remove committee photo file
const removeOldPhoto = (photoName) => {
  if (!photoName) return;
  const filePath = path.join(__dirname, '../../uploads/committee', photoName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error deleting committee photo:', e);
    }
  }
};

// GET all committee members (Public)
const getAllCommittee = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM committee ORDER BY id ASC');
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching committee:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve committee members.' });
  }
};

// POST add committee member (Admin only)
const createCommittee = async (req, res) => {
  try {
    const { name, position, department, student_id, batch } = req.body;

    if (!name || !position) {
      return res.status(400).json({ success: false, message: 'Name and position are required.' });
    }

    const photo = req.file ? req.file.filename : null;

    const [result] = await db.query(
      `INSERT INTO committee (name, position, department, student_id, batch, photo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        position.trim(),
        department ? department.trim() : null,
        student_id ? student_id.trim() : null,
        batch ? batch.trim() : null,
        photo
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Committee member added successfully.',
      committeeId: result.insertId
    });
  } catch (error) {
    console.error('Error adding committee member:', error);
    return res.status(500).json({ success: false, message: 'Failed to add committee member.' });
  }
};

// PUT update committee member (Admin only)
const updateCommittee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, department, student_id, batch } = req.body;

    const [rows] = await db.query('SELECT * FROM committee WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee member not found.' });
    }

    const existing = rows[0];
    let photo = existing.photo;

    if (req.file) {
      photo = req.file.filename;
      removeOldPhoto(existing.photo);
    }

    await db.query(
      `UPDATE committee
       SET name = ?, position = ?, department = ?, student_id = ?, batch = ?, photo = ?
       WHERE id = ?`,
      [
        name || existing.name,
        position || existing.position,
        department !== undefined ? department : existing.department,
        student_id !== undefined ? student_id : existing.student_id,
        batch !== undefined ? batch : existing.batch,
        photo,
        id
      ]
    );

    return res.json({ success: true, message: 'Committee member updated successfully.' });
  } catch (error) {
    console.error('Error updating committee member:', error);
    return res.status(500).json({ success: false, message: 'Failed to update committee member.' });
  }
};

// DELETE committee member (Admin only)
const deleteCommittee = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT photo FROM committee WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee member not found.' });
    }

    removeOldPhoto(rows[0].photo);

    await db.query('DELETE FROM committee WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Committee member removed successfully.' });
  } catch (error) {
    console.error('Error deleting committee member:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove committee member.' });
  }
};

module.exports = {
  getAllCommittee,
  createCommittee,
  updateCommittee,
  deleteCommittee
};
