import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle,
  LayoutGrid,
  CheckCircle2,
  FileText
} from 'lucide-react';
import './TakingExam.css';

interface Question {
  detail_id: number;
  question_id: number;
  selected_option: string | null;
  content: string;
  options: string[];
  image_url: string | null;
}

interface ExamInfo {
  exam_name: string;
  duration_minutes: number;
  start_time: string;
}

const TakingExam: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const location = useLocation();
  const attemptType = location.state?.attemptType || 'official';

  const { token } = useAuth();

  const fetchAttemptData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`http://localhost:3001/api/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data.questions);
      setExam(res.data.exam);

      // Calculate time left
      const startTime = new Date(res.data.exam.start_time).getTime();
      const durationMs = res.data.exam.duration_minutes * 60 * 1000;
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
      setTimeLeft(remaining);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching exam data:', err);
      alert('Không thể tải dữ liệu bài thi.');
      navigate('/student-dashboard');
    }
  }, [attemptId, token, navigate]);

  useEffect(() => {
    fetchAttemptData();
  }, [fetchAttemptData]);

  const handleSubmit = useCallback(async () => {
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post(`http://localhost:3001/api/attempts/${attemptId}/submit`, { tabSwitchCount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Redirect to results with state
      navigate('/student/results', { state: { result: res.data, attemptType } });
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi nộp bài. Vui lòng kiểm tra kết nối mạng.');
      setIsSubmitting(false);
    }
  }, [attemptId, token, navigate, isSubmitting, tabSwitchCount, attemptType]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  // Tab switching / Visibility protection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        setTabSwitchCount(prev => prev + 1);
        alert('CẢNH BÁO: Bạn vừa rời khỏi màn hình làm bài. Mọi hành vi chuyển tab đều bị ghi lại!');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSubmitting]);

  const handleAnswerSelect = async (answer: string) => {
    if (!token || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    if (currentQ.selected_option === answer) return;

    // Update locally
    const newQuestions = [...questions];
    newQuestions[currentIndex].selected_option = answer;
    setQuestions(newQuestions);

    // Update server (Sync progress)
    try {
      await axios.post('http://localhost:3001/api/attempts/update-answer', {
        detailId: currentQ.detail_id,
        answer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !exam) {
    return <div className="exam-loading">Đang chuẩn bị đề thi...</div>;
  }

  const currentQ = questions[currentIndex];
  const progress = (questions.filter(q => q.selected_option).length / questions.length) * 100;

  return (
    <div className="exam-taking-container">
      {/* Header with Timer */}
      <header className="exam-header">
        <div className="exam-meta">
          <FileText className="text-indigo-500" />
          <div className="flex flex-col">
            <h1 className="exam-name">{exam.exam_name}</h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded w-fit ${attemptType === 'mock' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {attemptType === 'mock' ? 'CHẾ ĐỘ THI THỬ' : 'THI CHÍNH THỨC'}
            </span>
          </div>
        </div>
        <div className={`exam-timer ${timeLeft && timeLeft < 300 ? 'warning' : ''}`}>
          <Clock size={20} />
          <span>{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
        </div>
        <button 
          className="btn-submit-main" 
          onClick={() => setShowConfirmSubmit(true)}
        >
          Nộp bài <Send size={16} />
        </button>
      </header>

      <div className="exam-layout">
        {/* Main Question Area */}
        <div className="question-content-area">
          <div className="question-card">
            <div className="question-number">Câu hỏi {currentIndex + 1}</div>
            <div className="question-text" dangerouslySetInnerHTML={{ __html: currentQ.content }}></div>
            
            {currentQ.image_url && (
              <div className="question-image-box">
                <img src={currentQ.image_url} alt="Question" />
              </div>
            )}

            <div className="options-list">
              {currentQ.options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C...
                return (
                  <label 
                    key={idx} 
                    className={`option-item ${currentQ.selected_option === label ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(label)}
                  >
                    <div className="option-label">{label}</div>
                    <div className="option-text">{opt}</div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="navigation-footer">
            <button 
              className="nav-btn" 
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              <ChevronLeft /> Câu trước
            </button>
            <div className="progress-info">
              Đã làm {questions.filter(q => q.selected_option).length}/{questions.length} câu
            </div>
            {currentIndex === questions.length - 1 ? (
              <button 
                className="nav-btn submit"
                onClick={() => setShowConfirmSubmit(true)}
              >
                Hoàn thành <CheckCircle2 size={18} />
              </button>
            ) : (
              <button 
                className="nav-btn"
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                Câu tiếp <ChevronRight />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Question Navigator */}
        <aside className="question-navigator">
          <div className="navigator-header">
            <LayoutGrid size={18} /> Danh sách câu hỏi
          </div>
          <div className="navigator-grid">
            {questions.map((q, idx) => (
              <button 
                key={idx}
                className={`nav-grid-item ${currentIndex === idx ? 'current' : ''} ${q.selected_option ? 'answered' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <span className="q-num">{idx + 1}</span>
                {q.selected_option && <span className="q-check">✓</span>}
              </button>
            ))}
          </div>
          <div className="progress-container">
            <div className="progress-label">Tiến độ hoàn thành</div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="exam-modal-overlay">
          <div className="exam-modal">
            <AlertTriangle className="text-amber-500 mb-4" size={48} />
            <h2>Xác nhận nộp bài?</h2>
            <p>Bạn vẫn còn thời gian. Bạn có chắc chắn muốn kết thúc bài thi và nộp kết quả ngay bây giờ?</p>
            <div className="result-actions-grid">
              <button className="btn-action secondary" onClick={() => setShowConfirmSubmit(false)}>Tiếp tục làm bài</button>
              <button className="btn-action primary" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Đang nộp...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakingExam;
