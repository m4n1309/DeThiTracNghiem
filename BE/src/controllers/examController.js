import pool from '../config/db.js';

/**
 * Get all exams (Active only)
 */
export const getExams = async (req, res) => {
  const { id, role } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    let exams;
    let totalItems = 0;

    if (role === 'admin') {
      // 1. Total count
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM Exams e
        JOIN Subjects s ON e.subject_id = s.subject_id
        JOIN Users u ON e.created_by = u.user_id
        WHERE e.is_active = 1
      `);
      totalItems = countResult[0].total;

      // 2. Paginated data
      const query = `
        SELECT e.*, s.subject_name, u.username as creator_name 
        FROM Exams e
        JOIN Subjects s ON e.subject_id = s.subject_id
        JOIN Users u ON e.created_by = u.user_id
        WHERE e.is_active = 1
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `;
      [exams] = await pool.query(query, [limit, offset]);
    } else {
      // 1. Total count for teacher
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM Exams e
        JOIN Subjects s ON e.subject_id = s.subject_id
        LEFT JOIN Subject_Teachers st ON e.subject_id = st.subject_id AND st.teacher_id = ?
        JOIN Users u ON e.created_by = u.user_id
        WHERE e.is_active = 1
        AND (e.created_by = ? OR st.teacher_id = ?)
      `;
      const [countResult] = await pool.execute(countQuery, [id, id, id]);
      totalItems = countResult[0].total;

      // 2. Paginated data
      const query = `
        SELECT e.*, s.subject_name, u.username as creator_name 
        FROM Exams e
        JOIN Subjects s ON e.subject_id = s.subject_id
        LEFT JOIN Subject_Teachers st ON e.subject_id = st.subject_id AND st.teacher_id = ?
        JOIN Users u ON e.created_by = u.user_id
        WHERE e.is_active = 1
        AND (e.created_by = ? OR st.teacher_id = ?)
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `;
      [exams] = await pool.query(query, [id, id, id, limit, offset]);
    }

    res.json({
      data: exams,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get question bank statistics for a subject
 */
export const getExamStats = async (req, res) => {
  const { subject_id } = req.params;

  try {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Questions WHERE subject_id = ? AND is_active = 1',
      [subject_id]
    );
    res.json({ total: rows[0].count });
  } catch (error) {
    console.error('Error fetching exam stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new exam configuration
 */
export const createExam = async (req, res) => {
  const {
    exam_name,
    subject_id,
    duration_minutes,
    total_questions,
    total_points,
    passing_score,
    start_time,
    end_time,
    allow_practice,
    practice_limit,
    shuffle_questions,
    shuffle_options,
    show_results
  } = req.body;
  const createdBy = req.user.id;

  try {
    // 2. Validate question availability in bank (Total only)
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Questions WHERE subject_id = ? AND is_active = 1',
      [subject_id]
    );
    const available = rows[0].count;

    if (total_questions > available) {
      return res.status(400).json({
        message: `Ngân hàng câu hỏi không đủ. Có sẵn: ${available}. Cần: ${total_questions}`
      });
    }

    // 3. Insert record
    const [result] = await pool.execute(
      `INSERT INTO Exams (
        exam_name, subject_id, created_by, duration_minutes, total_questions, 
        total_points, passing_score, start_time, end_time, allow_practice, 
        practice_limit, shuffle_questions, shuffle_options, show_results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exam_name, subject_id, createdBy, duration_minutes, total_questions,
        total_points || 10.0, passing_score || 5.0,
        start_time || null, end_time || null, allow_practice ? 1 : 0,
        practice_limit || 0, shuffle_questions ? 1 : 0, shuffle_options !== false ? 1 : 0,
        show_results !== false ? 1 : 0
      ]
    );

    res.status(201).json({ message: 'Tạo kỳ thi thành công', examId: result.insertId });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update exam configuration
 */
export const updateExam = async (req, res) => {
  const { id } = req.params;
  const {
    exam_name,
    duration_minutes,
    total_questions,
    passing_score,
    start_time,
    end_time,
    allow_practice,
    practice_limit,
    is_active,
    shuffle_questions,
    shuffle_options,
    show_results
  } = req.body;

  try {
    await pool.execute(
      `UPDATE Exams SET 
        exam_name = ?, duration_minutes = ?, total_questions = ?, 
        passing_score = ?, start_time = ?, end_time = ?, 
        allow_practice = ?, practice_limit = ?, is_active = ?,
        shuffle_questions = ?, shuffle_options = ?, show_results = ?
       WHERE exam_id = ?`,
      [
        exam_name, duration_minutes, total_questions,
        passing_score, start_time || null, end_time || null,
        allow_practice ? 1 : 0, practice_limit || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1,
        shuffle_questions ? 1 : 0, shuffle_options !== false ? 1 : 0, show_results !== false ? 1 : 0,
        id
      ]
    );

    res.json({ message: 'Cập nhật kỳ thi thành công' });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete exam (Soft Delete)
 */
export const deleteExam = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE Exams SET is_active = 0 WHERE exam_id = ?', [id]);
    res.json({ message: 'Đã xóa kỳ thi' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
