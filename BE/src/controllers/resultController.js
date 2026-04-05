import pool from '../config/db.js';

/**
 * Get all results for a specific exam
 * Logic: Join Results with Exam_Participants and Users to get student details.
 */
export const getResultsByExam = async (req, res) => {
  const { examId } = req.params;
  const { id, role } = req.user;

  if (!examId || examId === 'undefined') {
    return res.status(400).json({ message: 'Mã kỳ thi không hợp lệ.' });
  }

  try {
    // 1. Check permissions (Teacher who created it, or Admin, or Assigned Teacher)
    const [exams] = await pool.execute(`
      SELECT e.created_by, e.subject_id, st.teacher_id as assigned_teacher
      FROM Exams e
      LEFT JOIN Subject_Teachers st ON e.subject_id = st.subject_id AND st.teacher_id = ?
      WHERE e.exam_id = ?
    `, [id, examId]);

    if (exams.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kỳ thi.' });
    }

    if (role !== 'admin' && exams[0].created_by !== id && !exams[0].assigned_teacher) {
      return res.status(403).json({ message: 'Bạn không có quyền xem kết quả của kỳ thi này.' });
    }


    // 2. Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 3. Fetch total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM Results WHERE exam_id = ?',
      [examId]
    );
    const totalItems = countResult[0].total;

    // 4. Fetch results
    const [results] = await pool.query(
      `SELECT r.*, p.exam_code, p.full_name, e.exam_name, e.passing_score
       FROM Results r
       JOIN Exam_Participants p ON r.participant_id = p.participant_id
       JOIN Exams e ON r.exam_id = e.exam_id
       WHERE r.exam_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [examId, limit, offset]
    );

    res.json({
      data: results,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get aggregate stats for an exam
 */
export const getExamStats = async (req, res) => {
  const { examId } = req.params;

  if (!examId || examId === 'undefined') {
    return res.status(400).json({ message: 'Mã kỳ thi không hợp lệ.' });
  }

  const { id, role } = req.user;

  try {
    // Permission check
    if (role === 'teacher') {
      const [permission] = await pool.execute(`
        SELECT e.exam_id FROM Exams e
        LEFT JOIN Subject_Teachers st ON e.subject_id = st.subject_id AND st.teacher_id = ?
        WHERE e.exam_id = ? AND (e.created_by = ? OR st.teacher_id = ?)
      `, [id, examId, id, id]);

      if (permission.length === 0) {
        return res.status(403).json({ message: 'Bạn không có quyền xem thống kê của kỳ thi này.' });
      }
    }

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_participants,
        AVG(total_score) as avg_score,
        MAX(total_score) as max_score,
        MIN(total_score) as min_score,
        SUM(CASE WHEN total_score >= (SELECT passing_score FROM Exams WHERE exam_id = ?) THEN 1 ELSE 0 END) as passed_count
      FROM Results 
      WHERE exam_id = ?`,
      [examId, examId]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching exam stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get score distribution (bins) for an exam
 */
export const getScoreDistribution = async (req, res) => {
  const { examId } = req.params;

  if (!examId || examId === 'undefined') {
    return res.status(400).json({ message: 'Mã kỳ thi không hợp lệ.' });
  }

  const { id, role } = req.user;

  try {
    // Permission check
    if (role === 'teacher') {
      const [permission] = await pool.execute(`
        SELECT e.exam_id FROM Exams e
        LEFT JOIN Subject_Teachers st ON e.subject_id = st.subject_id AND st.teacher_id = ?
        WHERE e.exam_id = ? AND (e.created_by = ? OR st.teacher_id = ?)
      `, [id, examId, id, id]);

      if (permission.length === 0) {
        return res.status(403).json({ message: 'Bạn không có quyền xem phổ điểm của kỳ thi này.' });
      }
    }

    const [distribution] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN total_score < 2 THEN 1 ELSE 0 END) as '0-2',
        SUM(CASE WHEN total_score >= 2 AND total_score < 4 THEN 1 ELSE 0 END) as '2-4',
        SUM(CASE WHEN total_score >= 4 AND total_score < 6 THEN 1 ELSE 0 END) as '4-6',
        SUM(CASE WHEN total_score >= 6 AND total_score < 8 THEN 1 ELSE 0 END) as '6-8',
        SUM(CASE WHEN total_score >= 8 THEN 1 ELSE 0 END) as '8-10'
       FROM Results 
       WHERE exam_id = ?`,
      [examId]
    );

    const data = distribution[0];
    const formatted = Object.keys(data).map(key => ({
      range: key,
      count: parseInt(data[key]) || 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get subject-wise overall performance (for multi-dimensional analysis)
 */
export const getSubjectStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        s.subject_name,
        COUNT(r.result_id) as total_exams_taken,
        AVG(r.total_score) as avg_score
       FROM Subjects s
       JOIN Exams e ON s.subject_id = e.subject_id
       JOIN Results r ON e.exam_id = r.exam_id
       GROUP BY s.subject_id, s.subject_name`
    );
    res.json(stats);
  } catch (error) {
    console.error('Error fetching subject stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get summary statistics for all exams
 */
export const getOverallExamsSummary = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Get total count - MUST match the join in the data query
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM Exams e
      JOIN Subjects s ON e.subject_id = s.subject_id
    `);
    const totalItems = countResult[0].total;

    // 2. Get paginated data
    const [summaries] = await pool.query(
      `SELECT 
        e.exam_id, 
        e.exam_name, 
        s.subject_name,
        COUNT(r.result_id) as total_participants, 
        AVG(r.total_score) as avg_score,
        SUM(CASE WHEN r.total_score >= e.passing_score THEN 1 ELSE 0 END) as passed_count,
        e.start_time
      FROM Exams e
      JOIN Subjects s ON e.subject_id = s.subject_id
      LEFT JOIN Results r ON e.exam_id = r.exam_id
      GROUP BY e.exam_id, e.exam_name, s.subject_name, e.start_time
      ORDER BY e.start_time DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      data: summaries,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching overall exams summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get summary summary statistics for all students who have taken exams
 */
export const getOverallStudentsSummary = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Get total count - MUST match the grouping in the data query
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM (
        SELECT p.student_code, p.full_name
        FROM Exam_Participants p
        JOIN Results r ON p.participant_id = r.participant_id
        GROUP BY p.student_code, p.full_name
      ) as subquery
    `);
    const totalItems = countResult[0].total;

    // 2. Get paginated data
    const [summaries] = await pool.query(
      `SELECT 
        p.student_code,
        p.full_name, 
        COUNT(r.result_id) as exams_taken,
        AVG(r.total_score) as overall_avg_score,
        MAX(r.created_at) as last_exam_at
      FROM Exam_Participants p
      JOIN Results r ON p.participant_id = r.participant_id
      GROUP BY p.student_code, p.full_name
      ORDER BY overall_avg_score DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      data: summaries,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching overall students summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get overall pass/fail rate across all exams
 */
export const getOverallPassFailRate = async (req, res) => {
  try {
    const [rate] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN r.total_score >= e.passing_score THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN r.total_score < e.passing_score THEN 1 ELSE 0 END) as failed
       FROM Results r
       JOIN Exams e ON r.exam_id = e.exam_id`
    );
    res.json(rate[0]);
  } catch (error) {
    console.error('Error fetching overall pass/fail rate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get monthly result trends (last 6 months)
 */
export const getMonthlyTrends = async (req, res) => {
  try {
    const [trends] = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%m/%Y') as month_year,
        COUNT(*) as count
       FROM Results
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month_year
       ORDER BY MIN(created_at) ASC`
    );
    res.json(trends);
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

