import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  XCircle
} from 'lucide-react';
import './ExamResult.css';

const ExamResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result } = location.state || { result: null };

  if (!result) {
    return (
      <div className="result-container">
        <div className="result-card text-center">
          <h2>Không tìm thấy kết quả.</h2>
          <button onClick={() => navigate('/student-login')} className="btn-primary mt-4">Quay lại đăng nhập</button>
        </div>
      </div>
    );
  }

  const showResults = result.showResults !== false;
  const score = parseFloat(result.score || 0).toFixed(1);
  const passingScore = parseFloat(result.passing_score || 5.0).toFixed(1);
  const isPassed = result.isPassed !== undefined ? result.isPassed : parseFloat(score) >= parseFloat(passingScore);


  return (
    <div className="result-container">
      <div className="result-card animate-in">
        <div className="result-status-section">
          {isPassed ? (
            <div className="status-badge passed">
              <Trophy size={48} className="medal-icon" />
              <h2 className="status-text">★ ĐẠT ★</h2>
            </div>
          ) : (
            <div className="status-badge failed">
              <XCircle size={48} className="medal-icon" />
              <h2 className="status-text">CHƯA ĐẠT</h2>
            </div>
          )}
          
          {showResults ? (
            <div className="score-display">
              <span className="score-label">Kết quả điểm số</span>
              <div className="score-value-wrapper">
                <span className="score-main">{score}</span>
                <span className="score-max">/10</span>
              </div>
            </div>
          ) : (
            <div className="score-display hidden-mode">
              <span className="score-label">Trạng thái</span>
              <div className="score-value-wrapper">
                <span className="score-main text-2xl">ĐÃ NỘP BÀI</span>
              </div>
            </div>
          )}
        </div>


        {showResults ? (
          <>
            <div className="result-details-section">
              <h3>Thông tin chi tiết</h3>
              <div className="details-list">
                <div className="detail-row">
                  <span className="label">├─ Tổng số câu:</span>
                  <span className="value">{result.total}</span>
                </div>
                <div className="detail-row">
                  <span className="label">├─ Trả lời đúng:</span>
                  <span className="value text-emerald-600">{result.correctCount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">├─ Trả lời sai:</span>
                  <span className="value text-rose-600">{result.total - result.correctCount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">├─ Thời gian làm bài:</span>
                  <span className="value">{result.durationMinutes || 0} phút</span>
                </div>
                <div className="detail-row">
                  <span className="label">└─ Tỷ lệ chính xác:</span>
                  <span className="value font-bold">{Math.round((result.correctCount / result.total) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="analysis-section">
              <h3>Phân tích kết quả</h3>
              <div className="progress-analysis">
                <div className="progress-info">
                  <span>Tiến độ đạt được</span>
                  <span>{Math.round((parseFloat(score) / 10) * 100)}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    style={{ width: `${(parseFloat(score) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden-results-msg animate-pulse">
            <p>Bài làm của bạn đã được ghi nhận thành công.</p>
            <p className="text-sm text-gray-500 mt-2">Kết quả chi tiết sẽ được công bố sau khi kỳ thi kết thúc.</p>
          </div>
        )}


        <div className="result-actions-grid">
          {showResults && result.attemptId && (
            <button 
              className="btn-action secondary" 
              onClick={() => navigate(`/exam-review/${result.attemptId}`)}
            >
              Xem chi tiết
            </button>
          )}



          <button className="btn-action primary" onClick={() => navigate('/student/select-exam')}>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
