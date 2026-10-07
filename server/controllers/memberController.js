const db = require('../db');

// GET all members (Admin only)
const getAllMembers = async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT id, name, student_id, department, batch, email, role, status, created_at 
               FROM users WHERE role = 'member'`;
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR student_id LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching members:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve members.' });
  }
};

// PUT approve member (Admin only)
const approveMember = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT id, name, status FROM users WHERE id = ? AND role = "member"', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    await db.query('UPDATE users SET status = "active" WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Member "${rows[0].name}" has been approved successfully.`
    });
  } catch (error) {
    console.error('Error approving member:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve member.' });
  }
};

// PUT reject member (Admin only)
const rejectMember = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT id, name, status FROM users WHERE id = ? AND role = "member"', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    await db.query('UPDATE users SET status = "rejected" WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Member "${rows[0].name}" has been rejected.`
    });
  } catch (error) {
    console.error('Error rejecting member:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject member.' });
  }
};

// GET Admin Dashboard Statistics
const getAdminStats = async (req, res) => {
  try {
    const [[activeMembers]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "member" AND status = "active"');
    const [[pendingMembers]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "member" AND status = "pending"');
    const [[totalActivities]] = await db.query('SELECT COUNT(*) as count FROM activities');
    const [[totalCommittee]] = await db.query('SELECT COUNT(*) as count FROM committee');
    const [[totalGallery]] = await db.query('SELECT COUNT(*) as count FROM gallery');

    // Recent 5 pending registrations
    const [recentPending] = await db.query(
      `SELECT id, name, student_id, department, batch, email, created_at 
       FROM users 
       WHERE role = "member" AND status = "pending" 
       ORDER BY created_at DESC LIMIT 5`
    );

    // Upcoming activities
    const [upcomingActivities] = await db.query(
      `SELECT id, title, date, location, status 
       FROM activities 
       WHERE status = "upcoming" 
       ORDER BY date ASC LIMIT 5`
    );

    return res.json({
      success: true,
      data: {
        activeMembers: activeMembers.count,
        pendingMembers: pendingMembers.count,
        totalActivities: totalActivities.count,
        totalCommittee: totalCommittee.count,
        totalGallery: totalGallery.count,
        recentPending,
        upcomingActivities
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin stats.' });
  }
};

// GET Member Dashboard Statistics
const getMemberStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[totalActivities]] = await db.query('SELECT COUNT(*) as count FROM activities');
    const [[joinedActivities]] = await db.query('SELECT COUNT(*) as count FROM registrations WHERE user_id = ?', [userId]);

    const [upcomingActivities] = await db.query(
      `SELECT id, title, date, location, status, image 
       FROM activities 
       WHERE status = "upcoming" 
       ORDER BY date ASC LIMIT 4`
    );

    return res.json({
      success: true,
      data: {
        totalActivities: totalActivities.count,
        joinedActivities: joinedActivities.count,
        upcomingActivities
      }
    });
  } catch (error) {
    console.error('Error fetching member stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve member stats.' });
  }
};

module.exports = {
  getAllMembers,
  approveMember,
  rejectMember,
  getAdminStats,
  getMemberStats
};
