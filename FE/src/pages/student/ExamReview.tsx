import API_BASE_URL from '../../config/api';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronLeft,
  Info,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import './ExamReview.css';

interface ReviewDetail {
  content: string;
  image_url: string | null;
  options: string[];
  selected: string[]; // Changed from string | null
  correct: string[];
  is_correct: boolean;
}

interface ExamReviewData {
  exam: {
    exam_name: string;
    duration_minutes: number;
  };
  details: ReviewDetail[];
}

const ExamReview: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [data, setData] = useState<ExamReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/attempts/${attemptId}/review`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err: any) {
        console.error('Error fetching review:', err);
        setError(err.response?.data?.message || 'Không thể tải chi tiết bài thi.');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [attemptId, token]);

  if (loading) return <div className="review-loading">Đang tải chi tiết bài làm...</div>;
  if (error || !data) return <div className="review-error">{error || 'Dữ liệu không khả dụng'}</div>;

  const correctCount = data.details.filter(d => d.is_correct).length;
  const unansweredCount = data.details.filter(d => d.selected.length === 0).length;
  const incorrectCount = data.details.length - correctCount - unansweredCount;
  const totalCount = data.details.length;
  const score = ((correctCount / totalCount) * 10).toFixed(1);

  return (
    <div className="exam-review-container">
      <header className="review-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="title-group">
            <h1>Xem chi tiết bài làm</h1>
            <p>{data.exam.exam_name}</p>
          </div>
        </div>
        <div className="review-summary-badges">
          <div className="summary-badge score">
            <Trophy size={18} />
            <span>{score} / 10</span>
          </div>
          <div className="summary-badge accuracy">
            <Target size={18} />
            <span>{correctCount}/{totalCount} Đúng</span>
          </div>
          <div className="summary-badge duration">
            <Clock size={18} />
            <span>{data.exam.duration_minutes} phút</span>
          </div>
        </div>
      </header>

      <div className="review-content">
        <aside className="review-sidebar">
          <div className="nav-card">
            <h3>Danh sách câu hỏi</h3>
            <div className="q-nav-grid">
              {data.details.map((d, idx) => (
                <a 
                  key={idx} 
                  href={`#question-${idx}`}
                  className={`q-nav-item ${d.is_correct ? 'correct' : (d.selected.length > 0 ? 'incorrect' : 'unanswered')}`}
                >
                  {idx + 1}
                </a>
              ))}
            </div>
            <div className="legend">
              <div className="legend-item">
                <span className="dot correct"></span> 
                Đúng: <span className="legend-count">{correctCount}</span>
              </div>
              <div className="legend-item">
                <span className="dot incorrect"></span> 
                Sai: <span className="legend-count">{incorrectCount}</span>
              </div>
              <div className="legend-item">
                <span className="dot unanswered"></span> 
                Bỏ trống: <span className="legend-count">{unansweredCount}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="review-main">
          {data.details.map((d, idx) => (
            <div key={idx} id={`question-${idx}`} className="review-q-card">
              <div className="q-card-header">
                <span className="q-number">Câu hỏi {idx + 1}</span>
                {d.is_correct ? (
                  <span className="q-status correct"><CheckCircle2 size={16} /> Chính xác</span>
                ) : (
                  <span className="q-status incorrect"><XCircle size={16} /> {d.selected.length > 0 ? 'Chưa đúng' : 'Chưa trả lời'}</span>
                )}
              </div>

              <div className="q-body">
                <div className="q-text" dangerouslySetInnerHTML={{ __html: d.content }}></div>
                {d.image_url && <img src={d.image_url} alt="Question" className="q-image" />}

                <div className="review-options">
                  {d.options.map((opt, oIdx) => {
                    const label = String.fromCharCode(65 + oIdx);
                    const isSelected = d.selected.includes(label);
                    const isCorrect = d.correct.includes(opt);
                    
                    let statusClass = '';
                    if (isCorrect) statusClass = 'is-correct-option';
                    if (isSelected && !isCorrect) statusClass = 'is-wrong-option';

                    return (
                      <div key={oIdx} className={`review-option ${statusClass} ${isSelected ? 'was-selected' : ''}`}>
                        <div className="option-label">{label}</div>
                        <div className="option-text">{opt}</div>
                        {isCorrect && <CheckCircle2 size={18} className="status-icon text-emerald-500" />}
                        {isSelected && !isCorrect && <XCircle size={18} className="status-icon text-rose-500" />}
                      </div>
                    );
                  })}
                </div>

                {!d.is_correct && (
                  <div className="explanation-box">
                    <Info size={16} />
                    <span>Đáp án đúng là: <strong>{d.correct.join(', ')}</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default ExamReview;
