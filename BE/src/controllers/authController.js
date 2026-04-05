import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Handle Admin/Teacher login
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.execute(
      'SELECT * FROM Users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Handle Student login (via Exam Code)
 */
const studentLogin = async (req, res) => {
  const { examCode } = req.body;

  try {
    const [participants] = await pool.execute(
      `SELECT ep.participant_id, ep.exam_id, ep.exam_code, ep.full_name, e.exam_name, e.start_time, e.end_time, e.allow_practice 
       FROM Exam_Participants ep
       JOIN Exams e ON ep.exam_id = e.exam_id
       WHERE ep.exam_code = ? AND e.is_active = 1`,
      [examCode]
    );

    if (participants.length === 0) {
      return res.status(401).json({ message: 'Số báo danh không tồn tại hoặc không có kỳ thi nào đang diễn ra.' });
    }

    // If only one exam, we can just return it. 
    // If multiple, the frontend will need to handle multiple options.
    // We'll return the whole list in 'exams' field.
    
    // We generate a token for the first one as default, 
    // but the frontend will re-authenticate or pick one.
    const p = participants[0];

    const token = jwt.sign(
      { 
        id: p.participant_id, 
        role: 'student', 
        fullName: p.full_name, 
        examId: p.exam_id,
        examCode: p.exam_code
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Đăng nhập học viên thành công',
      token,
      user: {
        role: 'student',
        fullName: p.full_name,
        examCode: p.exam_code,
        // We provide the list of available exams
        availableExams: participants.map(part => ({
          participant_id: part.participant_id,
          exam_id: part.exam_id,
          exam_name: part.exam_name,
          start_time: part.start_time,
          end_time: part.end_time,
          allow_practice: part.allow_practice
        }))
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get current user information
 */
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

export default {
  login,
  studentLogin,
  getMe
};
