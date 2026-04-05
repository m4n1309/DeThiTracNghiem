import pool from '../config/db.js';
import XLSX from 'xlsx';

/**
 * Helper to check if a teacher is assigned to a subject
 */
const checkSubjectPermission = async (teacherId, subjectId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM Subject_Teachers WHERE teacher_id = ? AND subject_id = ?',
    [teacherId, subjectId]
  );
  return rows.length > 0;
};

/**
 * Get questions for a specific subject
 */
export const getQuestions = async (req, res) => {
  const { id, role } = req.user;
  const subjectId = req.query.subjectId ? parseInt(req.query.subjectId) : null;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search || '';

  try {
    let queryParams = [];
    let whereClauses = ['q.is_active = 1'];

    if (subjectId) {
      whereClauses.push('q.subject_id = ?');
      queryParams.push(subjectId);
    }

    if (searchTerm) {
      whereClauses.push('q.content LIKE ?');
      queryParams.push(`%${searchTerm}%`);
    }

    // Role-based filtering for teachers
    if (role === 'teacher') {
      whereClauses.push('q.subject_id IN (SELECT subject_id FROM Subject_Teachers WHERE teacher_id = ?)');
      queryParams.push(id);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM Questions q ${whereStr}`,
      queryParams
    );
    const totalItems = countResult[0].total;

    // 2. Get paginated data
    const [questions] = await pool.query(
      `SELECT q.*, s.subject_name 
       FROM Questions q
       JOIN Subjects s ON q.subject_id = s.subject_id
       ${whereStr}
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Map DB fields to Frontend fields and Parse JSON
    const processedQuestions = questions.map(q => {
      let optionsArray = [];
      try {
        optionsArray = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        if (!Array.isArray(optionsArray)) optionsArray = [];
      } catch (e) { optionsArray = []; }

      let correctAnswerArr = [];
      try {
        correctAnswerArr = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : q.correct_answer;
        if (!Array.isArray(correctAnswerArr)) correctAnswerArr = [correctAnswerArr];
      } catch (e) { correctAnswerArr = []; }

      return {
        ...q,
        options: optionsArray,
        correct_answer: correctAnswerArr,
        question_text: q.content,
        option_a: optionsArray[0] || '',
        option_b: optionsArray[1] || '',
        option_c: optionsArray[2] || '',
        option_d: optionsArray[3] || '',
        correct_option: correctAnswerArr[0] || 'A'
      };
    });

    res.json({
      data: processedQuestions,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new question
 */
export const createQuestion = async (req, res) => {
  const { subjectId, questionText, optionA, optionB, optionC, optionD, correctOption, imageUrl } = req.body;
  const { id, role } = req.user;

  try {
    if (role === 'teacher') {
      const hasPermission = await checkSubjectPermission(id, subjectId);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Bạn không có quyền thêm câu hỏi cho môn học này.' });
      }
    }

    const optionsJson = JSON.stringify([optionA, optionB, optionC, optionD]);
    const correctAnswerJson = JSON.stringify([correctOption]);

    const [result] = await pool.execute(
      `INSERT INTO Questions (subject_id, content, options, correct_answer, image_url, created_by, points) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [subjectId, questionText, optionsJson, correctAnswerJson, imageUrl || null, id, 1.0]
    );

    res.status(201).json({ message: 'Question created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a question
 */
export const updateQuestion = async (req, res) => {
  const { id: question_id } = req.params;
  const { questionText, optionA, optionB, optionC, optionD, correctOption, imageUrl } = req.body;
  const { id: user_id, role } = req.user;

  try {
    const [original] = await pool.execute('SELECT subject_id FROM Questions WHERE question_id = ?', [question_id]);
    if (original.length === 0) return res.status(404).json({ message: 'Question not found' });

    const subjectId = original[0].subject_id;

    if (role === 'teacher') {
      const hasPermission = await checkSubjectPermission(user_id, subjectId);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Bạn không có quyền sửa câu hỏi của môn học này.' });
      }
    }

    const optionsJson = JSON.stringify([optionA, optionB, optionC, optionD]);
    const correctAnswerJson = JSON.stringify([correctOption]);

    await pool.execute(
      `UPDATE Questions SET content = ?, options = ?, correct_answer = ?, image_url = ? 
       WHERE question_id = ?`,
      [questionText, optionsJson, correctAnswerJson, imageUrl, question_id]
    );

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (req, res) => {
  const { id: question_id } = req.params;
  const { id: user_id, role } = req.user;

  try {
    const [original] = await pool.execute('SELECT subject_id FROM Questions WHERE question_id = ?', [question_id]);
    if (original.length === 0) return res.status(404).json({ message: 'Question not found' });

    const subjectId = original[0].subject_id;

    if (role === 'teacher') {
      const hasPermission = await checkSubjectPermission(user_id, subjectId);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa câu hỏi của môn học này.' });
      }
    }

    await pool.execute('UPDATE Questions SET is_active = 0 WHERE question_id = ?', [question_id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get list of subjects assigned to the current user
 */
export const getMySubjects = async (req, res) => {
  const { id, role } = req.user;

  try {
    let subjects;
    if (role === 'admin') {
      [subjects] = await pool.execute('SELECT subject_id, subject_name, subject_code FROM Subjects ORDER BY subject_name');
    } else {
      [subjects] = await pool.execute(`
        SELECT s.subject_id, s.subject_name, s.subject_code 
        FROM Subjects s
        JOIN Subject_Teachers st ON s.subject_id = st.subject_id
        WHERE st.teacher_id = ?
        ORDER BY s.subject_name
      `, [id]);
    }
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching my subjects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Generate Excel Template for Question Import
 */
export const getQuestionTemplate = async (req, res) => {
  try {
    const ws_data = [
      ['STT', 'Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án đúng', 'Môn'],
      [1, 'Thủ đô của Việt Nam là gì?', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'B', 'Toán học']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=question_template.xlsx');
    res.send(buf);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Parse Excel file and return preview
 */
export const importParse = async (req, res) => {
  const { id: user_id, role } = req.user;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const [allSubjects] = await pool.execute('SELECT subject_id, subject_name, subject_code FROM Subjects WHERE is_active = 1');

    let permittedSubjectIds = [];
    if (role === 'teacher') {
      const [rows] = await pool.execute('SELECT subject_id FROM Subject_Teachers WHERE teacher_id = ?', [user_id]);
      permittedSubjectIds = rows.map(r => r.subject_id);
    }

    const rowMappings = data.map(row => {
      const subjectName = (row['Môn'] || '').toString().trim();
      return allSubjects.find(s =>
        s.subject_name.toLowerCase() === subjectName.toLowerCase() ||
        s.subject_code.toLowerCase() === subjectName.toLowerCase()
      );
    }).filter(s => s !== undefined);

    const uniqueSubjectIds = [...new Set(rowMappings.map(s => s.subject_id))];

    let existingQuestions = [];
    if (uniqueSubjectIds.length > 0) {
      const placeholders = uniqueSubjectIds.map(() => '?').join(',');
      [existingQuestions] = await pool.execute(
        `SELECT subject_id, content FROM Questions WHERE subject_id IN (${placeholders}) AND is_active = 1`,
        uniqueSubjectIds
      );
    }

    const previewData = data.map((row, index) => {
      const errors = [];
      const questionText = (row['Câu hỏi'] !== undefined && row['Câu hỏi'] !== null) ? row['Câu hỏi'].toString().trim() : '';
      const optionA = row['A'];
      const optionB = row['B'];
      const optionC = row['C'];
      const optionD = row['D'];
      const correctOption = row['Đáp án đúng'] ? row['Đáp án đúng'].toString().toUpperCase() : '';
      const subjectName = row['Môn'];

      const isEmpty = (val) => val === undefined || val === null || val.toString().trim() === '';

      if (isEmpty(questionText)) errors.push('Thiếu nội dung câu hỏi');
      if (isEmpty(optionA) || isEmpty(optionB)) errors.push('Cần ít nhất 2 đáp án (A, B)');
      if (!['A', 'B', 'C', 'D'].includes(correctOption)) errors.push('Đáp án đúng phải là A, B, C hoặc D');
      if (isEmpty(subjectName)) errors.push('Thiếu tên môn học');

      const matchedSubject = allSubjects.find(s =>
        s.subject_name.toLowerCase() === (subjectName || '').toString().trim().toLowerCase() ||
        s.subject_code.toLowerCase() === (subjectName || '').toString().trim().toLowerCase()
      );

      if (!matchedSubject) {
        errors.push(`Môn học "${subjectName}" không tồn tại trong hệ thống`);
      } else {
        if (role === 'teacher' && !permittedSubjectIds.includes(matchedSubject.subject_id)) {
          errors.push(`Bạn không có quyền thêm câu hỏi cho môn "${subjectName}"`);
        }

        const isDuplicate = existingQuestions.some(eq =>
          eq.subject_id === matchedSubject.subject_id &&
          eq.content.toLowerCase().trim() === questionText.toLowerCase()
        );
        if (isDuplicate) {
          errors.push('Câu hỏi này đã tồn tại trong ngân hàng đề của môn học này');
        }
      }

      return {
        stt: row['STT'] || index + 1,
        questionText,
        options: [optionA, optionB, optionC, optionD],
        correctOption,
        subjectId: matchedSubject ? matchedSubject.subject_id : null,
        subjectName: matchedSubject ? matchedSubject.subject_name : subjectName,
        isValid: errors.length === 0,
        errors
      };
    });

    res.json({ questions: previewData });
  } catch (error) {
    console.error('Error parsing import file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Confirm and save imported questions
 */
export const importConfirm = async (req, res) => {
  const { questions } = req.body;
  const { id: user_id } = req.user;

  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const q of questions) {
      if (!q.isValid) continue;

      const optionsJson = JSON.stringify(q.options);
      const correctAnswerJson = JSON.stringify([q.correctOption]);

      await connection.execute(
        `INSERT INTO Questions (subject_id, content, options, correct_answer, created_by, points) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [q.subjectId, q.questionText, optionsJson, correctAnswerJson, user_id, 1.0]
      );
    }

    await connection.commit();
    res.json({ message: `Đã nhập thành công ${questions.filter(q => q.isValid).length} câu hỏi.` });
  } catch (error) {
    await connection.rollback();
    console.error('Error confirming import:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};
