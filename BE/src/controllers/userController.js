import bcrypt from 'bcrypt';
import pool from '../config/db.js';

/**
 * Get all users from the system
 */
export const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Get total count
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM Users');
    const totalItems = countResult[0].total;

    // 2. Get paginated data
    const [users] = await pool.query(
      `SELECT user_id, username, full_name, email, phone, role, is_active, created_at 
       FROM Users 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      data: users,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {

    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new user
 */
export const createUser = async (req, res) => {
  const { username, password, fullName, email, phone, role } = req.body;

  try {
    // Check if user already exists
    const [existing] = await pool.execute('SELECT user_id FROM Users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const defaultPass = password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPass, 10);

    const [result] = await pool.execute(
      'INSERT INTO Users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, fullName, email, phone, role || 'teacher']
    );

    res.status(201).json({
      message: 'User created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update user information
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, role } = req.body;

  try {
    await pool.execute(
      'UPDATE Users SET full_name = ?, email = ?, phone = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [fullName, email, phone, role, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Toggle user active status (Soft delete / Lock)
 */
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await pool.execute(
      'UPDATE Users SET is_active = ? WHERE user_id = ?',
      [is_active, id]
    );

    res.json({ message: `User status changed to ${is_active ? 'Active' : 'Inactive'}` });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Reset user password to default
 */
export const resetPassword = async (req, res) => {
  const { id } = req.params;
  const defaultPass = '123456';

  try {
    const hashedPassword = await bcrypt.hash(defaultPass, 10);
    await pool.execute(
      'UPDATE Users SET password = ? WHERE user_id = ?',
      [hashedPassword, id]
    );

    res.json({ message: `Password reset to default (123456)` });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete user (Hard delete)
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user is an admin or has connected records?
    // For now, let's allow it but warn in documentation.
    await pool.execute('DELETE FROM Users WHERE user_id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Cannot delete user. They might have related data (like subjects).' });
  }
};
