import pool from '../config/db.js';
import crypto from 'crypto';
import XLSX from 'xlsx';

/**
 * Generate a random Exam Code (SBD)
 */
const generateExamCode = () => {
  return 'SBD-' + crypto.randomBytes(3).toString('hex').toUpperCase();
};

/**
 * Get Excel Template for Students
 */
export const getStudentTemplate = async (req, res) => {
  try {
    const ws_data = [
      ['STT', 'Họ và tên', 'Mã sinh viên', 'Lớp', 'Email', 'Số báo danh (SBD)']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=student_template.xlsx');
    res.send(buf);
  } catch (error) {
    console.error('Error generating student template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Parse Student Excel file and return preview
 */
export const importParticipantsParse = async (req, res) => {
  const { examId } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const [existing] = await pool.execute(
      'SELECT student_code, exam_code FROM Exam_Participants WHERE exam_id = ?',
      [examId]
    );

    const existingStudentCodes = existing.map(e => (e.student_code || '').toString().toLowerCase());
    const existingExamCodes = existing.map(e => (e.exam_code || '').toString().toLowerCase());

    const seenStudentCodes = new Set();
    const seenExamCodes = new Set();

    const previewData = data.map((row, index) => {
      const errors = [];
      const fullName = (row['Họ và tên'] || '').toString().trim();
      const studentCode = (row['Mã sinh viên'] || '').toString().trim();
      const className = (row['Lớp'] || '').toString().trim();
      const email = (row['Email'] || '').toString().trim();
      let examCode = (row['Số báo danh (SBD)'] || '').toString().trim();

      if (!examCode && studentCode) {
        examCode = studentCode;
      }

      if (!fullName) errors.push('Thiếu họ và tên');

      if (studentCode) {
        const scLow = studentCode.toLowerCase();
        if (existingStudentCodes.includes(scLow)) {
          errors.push(`Mã sinh viên "${studentCode}" đã tồn tại trong kỳ thi này`);
        } else if (seenStudentCodes.has(scLow)) {
          errors.push(`Mã sinh viên "${studentCode}" bị trùng trong tệp tải lên`);
        }
        seenStudentCodes.add(scLow);
      }

      if (examCode) {
        const ecLow = examCode.toLowerCase();
        if (existingExamCodes.includes(ecLow)) {
          errors.push(`Số báo danh "${examCode}" đã tồn tại trong kỳ thi này`);
        } else if (seenExamCodes.has(ecLow)) {
          errors.push(`Số báo danh "${examCode}" bị trùng trong tệp tải lên`);
        }
        seenExamCodes.add(ecLow);
      }

      return {
        stt: row['STT'] || index + 1,
        fullName,
        studentCode,
        className,
        email,
        examCode,
        isValid: errors.length === 0,
        errors
      };
    });

    res.json({ participants: previewData });
  } catch (error) {
    console.error('Error parsing student file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Confirm Student Import
 */
export const importParticipantsConfirm = async (req, res) => {
  const { examId, participants } = req.body;

  if (!examId || !participants || !Array.isArray(participants)) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const p of participants) {
      if (!p.isValid) continue;

      const sbd = p.examCode || p.studentCode || generateExamCode();
      await connection.execute(
        `INSERT INTO Exam_Participants (exam_id, exam_code, full_name, student_code, class_name, email) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [examId, sbd, p.fullName, p.studentCode || null, p.className || null, p.email || null]
      );
    }

    await connection.commit();
    res.status(201).json({ message: `Successfully imported valid participants` });
  } catch (error) {
    await connection.rollback();
    console.error('Error confirming student import:', error);
    res.status(500).json({ message: 'Failed to confirm import. Check for duplicate entries.' });
  } finally {
    connection.release();
  }
};

/**
 * Get all participants for a specific exam
 */
export const getParticipants = async (req, res) => {
  const { examId } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required' });
    }

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM Exam_Participants WHERE exam_id = ?',
      [examId]
    );
    const totalItems = countResult[0].total;

    const [rows] = await pool.query(
      'SELECT * FROM Exam_Participants WHERE exam_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [examId, limit, offset]
    );

    res.json({
      data: rows,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Add a single participant
 */
export const addParticipant = async (req, res) => {
  const { examId, fullName, studentCode, className, email, examCode } = req.body;

  try {
    const sbd = examCode || studentCode || generateExamCode();
    const [result] = await pool.execute(
      `INSERT INTO Exam_Participants (exam_id, exam_code, full_name, student_code, class_name, email) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [examId, sbd, fullName, studentCode || null, className || null, email || null]
    );

    res.status(201).json({
      message: 'Participant added successfully',
      id: result.insertId,
      examCode: sbd
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Số báo danh hoặc mã sinh viên đã tồn tại trong kỳ thi này.' });
    }
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update participant information
 */
export const updateParticipant = async (req, res) => {
  const { id } = req.params;
  const { fullName, studentCode, className, email, examCode } = req.body;

  try {
    await pool.execute(
      `UPDATE Exam_Participants SET full_name = ?, student_code = ?, class_name = ?, email = ?, exam_code = ? 
       WHERE participant_id = ?`,
      [fullName, studentCode || null, className || null, email || null, examCode, id]
    );

    res.json({ message: 'Participant updated successfully' });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a participant
 */
export const deleteParticipant = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('DELETE FROM Exam_Participants WHERE participant_id = ?', [id]);
    res.json({ message: 'Participant deleted successfully' });
  } catch (error) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Bulk import participants
 */
export const importParticipants = async (req, res) => {
  const { examId, participants } = req.body;

  if (!participants || !Array.isArray(participants)) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const p of participants) {
      const sbd = p.examCode || generateExamCode();
      await connection.execute(
        `INSERT INTO Exam_Participants (exam_id, exam_code, full_name, student_code, class_name, email) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [examId, sbd, p.fullName, p.studentCode || null, p.className || null, p.email || null]
      );
    }

    await connection.commit();
    res.status(201).json({ message: `Successfully imported ${participants.length} participants` });
  } catch (error) {
    await connection.rollback();
    console.error('Error importing participants:', error);
    res.status(500).json({ message: 'Failed to import participants. Check for duplicate entries.' });
  } finally {
    connection.release();
  }
};
