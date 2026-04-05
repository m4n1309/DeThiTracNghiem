import pool from '../config/db.js';

/**
 * Get all subjects with their assigned teachers
 */
export const getAllSubjects = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Get total count
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM Subjects');
    const totalItems = countResult[0].total;

    // 2. Get paginated data
    const [subjects] = await pool.query(`
      SELECT s.*, 
        GROUP_CONCAT(u.full_name SEPARATOR ', ') as teacher_names,
        GROUP_CONCAT(u.user_id) as teacher_ids
      FROM Subjects s
      LEFT JOIN Subject_Teachers st ON s.subject_id = st.subject_id
      LEFT JOIN Users u ON st.teacher_id = u.user_id
      GROUP BY s.subject_id
      ORDER BY s.subject_name ASC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Parse teacher_ids string into an array of numbers
    const processedSubjects = subjects.map(s => ({
      ...s,
      teacher_ids: s.teacher_ids ? s.teacher_ids.split(',').map(Number) : []
    }));

    res.json({
      data: processedSubjects,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {

    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new subject with multiple teachers
 */
export const createSubject = async (req, res) => {
  const { subjectCode, subjectName, description, teacherIds } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert Subject
    const [result] = await connection.execute(
      'INSERT INTO Subjects (subject_code, subject_name, description) VALUES (?, ?, ?)',
      [subjectCode, subjectName, description]
    );
    const subjectId = result.insertId;

    // 2. Insert Teachers (Many-to-Many)
    if (teacherIds && teacherIds.length > 0) {
      const values = teacherIds.map(tId => [subjectId, tId]);
      await connection.query(
        'INSERT INTO Subject_Teachers (subject_id, teacher_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Subject created successfully', id: subjectId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating subject:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Mã môn học đã tồn tại' });
    }
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

/**
 * Update subject and its teacher assignments
 */
export const updateSubject = async (req, res) => {
  const { id } = req.params;
  const { subjectCode, subjectName, description, teacherIds } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Update Subject info
    await connection.execute(
      'UPDATE Subjects SET subject_code = ?, subject_name = ?, description = ? WHERE subject_id = ?',
      [subjectCode, subjectName, description, id]
    );

    // 2. Sync Teachers
    // First, remove old assignments
    await connection.execute('DELETE FROM Subject_Teachers WHERE subject_id = ?', [id]);

    // Then, insert new ones
    if (teacherIds && teacherIds.length > 0) {
      const values = teacherIds.map(tId => [id, tId]);
      await connection.query(
        'INSERT INTO Subject_Teachers (subject_id, teacher_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating subject:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

/**
 * Delete a subject
 */
export const deleteSubject = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if there are questions or exams linked?
    // In our schema, questions are linked directly to subjects.
    const [questions] = await pool.execute('SELECT question_id FROM Questions WHERE subject_id = ? LIMIT 1', [id]);
    if (questions.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa môn học đã có câu hỏi trong ngân hàng.' });
    }

    await pool.execute('DELETE FROM Subjects WHERE subject_id = ?', [id]);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
