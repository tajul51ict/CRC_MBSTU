const db = require('../db');
const fs = require('fs');
const path = require('path');

// Helper to remove gallery image file
const removeOldImage = (imageName) => {
  if (!imageName) return;
  const filePath = path.join(__dirname, '../../uploads/gallery', imageName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error deleting gallery image:', e);
    }
  }
};

// GET all gallery images (Public)
const getAllGallery = async (req, res) => {
  try {
    const { limit } = req.query;
    let sql = 'SELECT * FROM gallery ORDER BY created_at DESC, id DESC';
    const params = [];

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const [rows] = await db.query(sql, params);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve gallery images.' });
  }
};

// POST add gallery image (Admin only)
const createGallery = async (req, res) => {
  try {
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const image = req.file.filename;

    const [result] = await db.query(
      'INSERT INTO gallery (title, image) VALUES (?, ?)',
      [title ? title.trim() : 'CRC Activity Image', image]
    );

    return res.status(201).json({
      success: true,
      message: 'Image uploaded to gallery successfully.',
      galleryId: result.insertId
    });
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload image.' });
  }
};

// DELETE gallery image (Admin only)
const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT image FROM gallery WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gallery image not found.' });
    }

    removeOldImage(rows[0].image);

    await db.query('DELETE FROM gallery WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Image deleted from gallery successfully.' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete image.' });
  }
};

module.exports = {
  getAllGallery,
  createGallery,
  deleteGallery
};
