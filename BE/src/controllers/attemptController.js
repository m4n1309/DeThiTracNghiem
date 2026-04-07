import pool from '../config/db.js';

// Helper: Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  if (!array || !Array.isArray(array) || array.length <= 1) return array ? [...array] : [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Start an exam attempt for a student via Exam Code (SBD)
 */
export const startAttempt = async (req, res) => {
  const { examId, participantId, attemptType } = req.body; 

  try {
    const eid = parseInt(examId);
    const pid = parseInt(participantId);

    if (Number.isNaN(eid) || Number.isNaN(pid)) {
      return res.status(400).json({ message: 'Dữ liệu ID không hợp lệ.' });
    }

    // 1. Get exam and participant info
    const [exams] = await pool.query(
      `SELECT e.*, ep.participant_id 
       FROM Exams e
       JOIN Exam_Participants ep ON e.exam_id = ep.exam_id
       WHERE e.exam_id = ? AND ep.participant_id = ? AND e.is_active = 1`,
      [eid, pid]
    );

    if (exams.length === 0) {
      return res.status(404).json({ message: 'Thông tin kỳ thi hoặc thí sinh không lệ.' });
    }

    const e = exams[0];
    const now = new Date();
    const startTime = new Date(e.start_time);
    const endTime = new Date(e.end_time);

    if (now < startTime) {
      return res.status(403).json({ message: `Kỳ thi chưa bắt đầu. Thời gian bắt đầu: ${startTime.toLocaleString('vi-VN')}` });
    }
    if (now > endTime) {
      return res.status(403).json({ message: 'Kỳ thi đã kết thúc.' });
    }

    if (attemptType === 'official') {
      const [officialAttempts] = await pool.query(
        'SELECT attempt_id, status FROM Attempts WHERE participant_id = ? AND exam_id = ? AND attempt_type = "official"',
        [pid, eid]
      );
      if (officialAttempts.length > 0) {
        const latest = officialAttempts[0];
        if (latest.status === 'submitted' || latest.status === 'timeout') {
          return res.status(400).json({ message: 'Bạn đã hoàn thành bài thi chính thức và không được phép thi lại.' });
        }
        if (latest.status === 'doing') {
          return res.json({ attemptId: latest.attempt_id, message: 'Resuming official attempt' });
        }
      }
    } else if (attemptType === 'mock') {
      if (!e.allow_practice) {
        return res.status(403).json({ message: 'Kỳ thi này không cho phép thi thử.' });
      }
      const [mockAttempts] = await pool.query(
        'SELECT attempt_id, status FROM Attempts WHERE participant_id = ? AND exam_id = ? AND attempt_type = "mock" AND status = "doing"',
        [pid, eid]
      );
      if (mockAttempts.length > 0) {
        return res.json({ attemptId: mockAttempts[0].attempt_id, message: 'Resuming mock attempt' });
      }
    }

    // 4. GENERATE QUESTIONS
    const limit = parseInt(e.total_questions) || 40;
    const [qFromBank] = await pool.query(
      'SELECT question_id, options FROM Questions WHERE subject_id = ? AND is_active = 1 ORDER BY RAND() LIMIT ?',
      [e.subject_id, limit]
    );

    if (qFromBank.length < limit) {
      return res.status(400).json({ message: `Ngân hàng câu hỏi không đủ số lượng để tạo đề. Hiện có: ${qFromBank.length}/${limit}` });
    }

    const finalQuestions = e.shuffle_questions ? shuffleArray(qFromBank) : qFromBank;

    // 5. CREATE ATTEMPT RECORD
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [attemptResult] = await connection.query(
        'INSERT INTO Attempts (participant_id, exam_id, start_time, status, attempt_type) VALUES (?, ?, ?, "doing", ?)',
        [pid, eid, new Date(), attemptType]
      );
      const attemptId = attemptResult.insertId;

      for (const q of finalQuestions) {
        let rawOptions = q.options;
        if (typeof rawOptions === 'string') {
          try { rawOptions = JSON.parse(rawOptions); } catch (err) { rawOptions = []; }
        }
        
        let optionsToStore = rawOptions;
        if (e.shuffle_options) {
          optionsToStore = shuffleArray(rawOptions);
        }

        await connection.query(
          'INSERT INTO Attempt_Details (attempt_id, question_id, shuffled_options, selected_answer) VALUES (?, ?, ?, ?)',
          [attemptId, q.question_id, JSON.stringify(optionsToStore), JSON.stringify([])]
        );
      }

      await connection.commit();
      res.status(201).json({ attemptId, message: 'Bài thi đã được khởi tạo thành công.' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('CRITICAL ERROR starting attempt:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};

/**
 * Get question content for an active attempt
 */
export const getAttemptData = async (req, res) => {
  const { attemptId } = req.params;

  try {
    // Note: We use the shuffled_options stored at start
    const [rows] = await pool.query(
      `SELECT ad.detail_id, ad.question_id, ad.selected_answer, q.content, q.image_url, q.question_type, ad.shuffled_options
       FROM Attempt_Details ad
       JOIN Questions q ON ad.question_id = q.question_id
       WHERE ad.attempt_id = ?`,
      [attemptId]
    );

    // Also get exam info (timer)
    const [examInfo] = await pool.query(
      `SELECT e.exam_name, e.duration_minutes, a.start_time 
       FROM Attempts a 
       JOIN Exams e ON a.exam_id = e.exam_id 
       WHERE a.attempt_id = ?`,
      [attemptId]
    );

    if (examInfo.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin kỳ thi cho lượt thi này.' });
    }

    // Format questions for frontend (map selected_answer to simple format and use shuffled_options as options)
    const formattedQuestions = rows.map(r => ({
      detail_id: r.detail_id,
      question_id: r.question_id,
      question_type: r.question_type || 'single',
      selected_options: r.selected_answer || [], // Return full array
      content: r.content,
      options: r.shuffled_options || [],
      image_url: r.image_url
    }));

    res.json({ 
      questions: formattedQuestions,
      exam: examInfo[0]
    });
  } catch (error) {
    console.error('Error fetching attempt data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Save progress (update single answer)
 */
export const updateAnswer = async (req, res) => {
  const { detailId, answer, questionType } = req.body;

  try {
    // For MCQ, we might be toggling an answer, or replacing for single choice.
    // If questionType is provided, we can handle it here, but it's safer to let 
    // the frontend manage the array and just send the Final State.
    // However, if 'answer' is an array, we store it. If it's a string, we wrap it.
    const finalAnswer = Array.isArray(answer) ? answer : [answer];

    await pool.execute(
      'UPDATE Attempt_Details SET selected_answer = ? WHERE detail_id = ?',
      [JSON.stringify(finalAnswer), detailId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Submit and Grade
 */
export const submitAttempt = async (req, res) => {
  const { attemptId } = req.params;

  try {
    // 1. Fetch details with correct answers
    const [details] = await pool.execute(
      `SELECT ad.detail_id, ad.selected_answer, q.correct_answer, q.options, q.points, ad.shuffled_options
       FROM Attempt_Details ad
       JOIN Questions q ON ad.question_id = q.question_id
       WHERE ad.attempt_id = ?`,
      [attemptId]
    );


    // 2. Calculation logic (Auto Grading)
    let correctCount = 0;


    for (const d of details) {
      const selectedLabels = d.selected_answer || [];
      
      // 1. Resolve correct answers from original labels to original texts
      let originalOptions = d.options;
      if (typeof originalOptions === 'string') {
        try { originalOptions = JSON.parse(originalOptions); } catch (e) { originalOptions = []; }
      }
      
      let correctLabels = d.correct_answer;
      if (typeof correctLabels === 'string') {
        try { correctLabels = JSON.parse(correctLabels); } catch (e) { correctLabels = []; }
      }

      const actualCorrectTexts = (Array.isArray(correctLabels) ? correctLabels : []).map(label => {
        const idx = label.charCodeAt(0) - 65;
        return originalOptions[idx];
      }).filter(text => text !== undefined).sort();

      // 2. Resolve student selection from labels to texts using shuffled_options
      let currentShuffledOptions = d.shuffled_options;
      if (typeof currentShuffledOptions === 'string') {
        try { currentShuffledOptions = JSON.parse(currentShuffledOptions); } catch (e) { currentShuffledOptions = []; }
      }

      const chosenOptionsTexts = (Array.isArray(selectedLabels) ? selectedLabels : []).map(label => {
        const idx = label.charCodeAt(0) - 65;
        return (Array.isArray(currentShuffledOptions) ? currentShuffledOptions : [])[idx];
      }).filter(text => text !== undefined).sort();

      // 3. Compare (All or Nothing)
      const isCorrect = (actualCorrectTexts.length === chosenOptionsTexts.length) && 
                        actualCorrectTexts.every((val, index) => val === chosenOptionsTexts[index]);

      if (isCorrect) {
        correctCount++;
      }


      await pool.execute(
        'UPDATE Attempt_Details SET is_correct = ? WHERE detail_id = ?',
        [isCorrect ? 1 : 0, d.detail_id]
      );
    }

    const totalScore = details.length > 0 
      ? Number(((correctCount / details.length) * 10).toFixed(2)) 
      : 0;

    // 3. Update Attempts status

    await pool.execute(
      'UPDATE Attempts SET end_time = CURRENT_TIMESTAMP, status = "submitted" WHERE attempt_id = ?',
      [attemptId]
    );

    // 4. Update Results table ONLY for official attempts
    const [attemptInfo] = await pool.query(
      `SELECT a.participant_id, a.exam_id, a.attempt_type, e.show_results 
       FROM Attempts a 
       JOIN Exams e ON a.exam_id = e.exam_id 
       WHERE a.attempt_id = ?`, 
      [attemptId]
    );
    const { participant_id, exam_id, attempt_type, show_results } = attemptInfo[0];

    
    if (attempt_type === 'official') {
      const [existingResult] = await pool.execute('SELECT result_id FROM Results WHERE participant_id = ? AND exam_id = ?', [participant_id, exam_id]);
      
      if (existingResult.length > 0) {
        await pool.execute(
          'UPDATE Results SET total_score = ?, attempt_id = ? WHERE result_id = ?',
          [totalScore, attemptId, existingResult[0].result_id]
        );
      } else {
        await pool.execute(
          'INSERT INTO Results (participant_id, exam_id, attempt_id, total_score) VALUES (?, ?, ?, ?)',
          [participant_id, exam_id, attemptId, totalScore]
        );
      }
    }

    // If results are hidden, sanitize the response for students
    const response = {
      attemptId: attemptId,
      attemptType: attempt_type,
      showResults: show_results === 1 || attempt_type === 'mock' // Mock attempts always show results for feedback
    };

    if (response.showResults) {
      response.score = totalScore;
      response.correctCount = correctCount;
      response.total = details.length;
    }

    res.json(response);


  } catch (error) {
    console.error('Error submitting attempt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get detailed review for a finished attempt
 */
export const getAttemptReview = async (req, res) => {
  const { attemptId } = req.params;

  try {
    // 1. Check if attempt is submitted
    const [attempt] = await pool.query(
      `SELECT a.status, a.exam_id, a.participant_id, e.show_results 
       FROM Attempts a 
       JOIN Exams e ON a.exam_id = e.exam_id
       WHERE a.attempt_id = ?`,
      [attemptId]
    );


    if (attempt.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lượt thi.' });
    }

    if (attempt[0].status === 'doing') {
      return res.status(403).json({ message: 'Bạn không thể xem chi tiết khi bài thi đang diễn ra.' });
    }

    // Check if student is allowed to see results
    const { role } = req.user;
    if (role === 'student' && attempt[0].show_results === 0) {
      return res.status(403).json({ message: 'Quản trị viên đã tắt tính năng xem lại bài làm cho kỳ thi này.' });
    }


    // 2. Fetch details
    const [details] = await pool.query(
      `SELECT ad.detail_id, ad.selected_answer, ad.is_correct, ad.shuffled_options,
              q.content, q.image_url, q.correct_answer, q.options as original_options
       FROM Attempt_Details ad
       JOIN Questions q ON ad.question_id = q.question_id
       WHERE ad.attempt_id = ?`,
      [attemptId]
    );


    // 3. Exam info
    const [exam] = await pool.query(
      'SELECT exam_name, duration_minutes FROM Exams WHERE exam_id = ?',
      [attempt[0].exam_id]
    );

    res.json({
      exam: exam[0],
      details: details.map(d => {
        // Resolve correct answers from labels (A, B...) to original texts
        let originalOptions = d.original_options;
        if (typeof originalOptions === 'string') {
          try { originalOptions = JSON.parse(originalOptions); } catch (e) { originalOptions = []; }
        }
        
        let correctLabels = d.correct_answer;
        if (typeof correctLabels === 'string') {
          try {
            correctLabels = JSON.parse(correctLabels);
          } catch (e) {
            // Fallback for non-JSON strings (old data)
            correctLabels = [correctLabels];
          }
        }
        // Ensure it's an array for mapping
        if (!Array.isArray(correctLabels)) {
          correctLabels = [correctLabels];
        }

        const actualCorrectTexts = (Array.isArray(correctLabels) ? correctLabels : []).map(label => {
          const idx = label.charCodeAt(0) - 65;
          return originalOptions[idx];
        }).filter(text => text !== undefined);

        return {
          content: d.content,
          image_url: d.image_url,
          options: d.shuffled_options || [],
          selected: d.selected_answer || [], // Return whole array
          correct: actualCorrectTexts, // Send actual texts instead of labels
          is_correct: d.is_correct === 1
        };
      })
    });

  } catch (error) {
    console.error('Error fetching attempt review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

