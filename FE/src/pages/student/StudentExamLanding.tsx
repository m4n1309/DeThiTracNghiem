import API_BASE_URL from '../../config/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  HelpCircle, 
  Play, 
  AlertCircle,
  ShieldCheck,
  User,
  Gamepad2,
  GraduationCap as GraduationIcon,
  LogOut
} from 'lucide-react';
import './StudentExamLanding.css';

const StudentExamLanding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { user, token, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/student-login');
  };

  // Get selected exam and mode from state (passed from ExamSelection)
  const { selectedExam, mode } = location.state || { selectedExam: null, mode: 'official' };

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/student-login');
    }
    if (!selectedExam) {
      navigate('/student/select-exam');
    }
  }, [user, selectedExam, navigate]);

  const handleStartExam = async () => {
    if (!token || !user || !selectedExam) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/attempts/start`, {
        examId: selectedExam.exam_id,
        participantId: selectedExam.participant_id,
        attemptType: mode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { attemptId } = res.data;
      navigate(`/student/taking-exam/${attemptId}`, { state: { attemptType: mode } });
    } catch (err: unknown) {
      console.error('Lỗi khi bắt đầu bài thi:', err);
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu làm bài. Vui lòng kiểm tra lại trạng thái kỳ thi.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !selectedExam) return null;

  return (
    <div className="landing-container">
      <div className="landing-card animate-in">
        <div className="landing-header">
          <div className={`icon-badge ${mode === 'mock' ? 'bg-amber-500' : 'bg-indigo-600'}`}>
            {mode === 'mock' ? <Gamepad2 size={32} className="text-white" /> : <GraduationIcon size={32} className="text-white" />}
          </div>
          <h1>{selectedExam.exam_name}</h1>
          <div className="mode-indicator mb-4">
            <span className={`px-4 py-1 rounded-full text-sm font-bold ${mode === 'mock' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              CHẾ ĐỘ: {mode === 'mock' ? 'THI THỬ (LUYỆN TẬP)' : 'THI CHÍNH THỨC'}
            </span>
          </div>
          <div className="student-info-strip">
            <User size={16} />
            <span>{user?.fullName}</span>
            <span className="divider">|</span>
            <span>SBD: <strong>{user?.examCode}</strong></span>
            <button className="btn-logout-mini" onClick={handleLogout} title="Đăng xuất">
              <LogOut size={14} /> Thoát
            </button>
          </div>
        </div>

        <div className="exam-details-grid">
          <div className="detail-box">
            <Clock className="text-indigo-500" />
            <div className="detail-text">
              <span className="label">Thời gian làm bài</span>
              <span className="value">60 phút</span>
            </div>
          </div>
          <div className="detail-box">
            <HelpCircle className="text-indigo-500" />
            <div className="detail-text">
              <span className="label">Hình thức</span>
              <span className="value">Trắc nghiệm</span>
            </div>
          </div>
        </div>

        <div className="instructions-section">
          <h2><ShieldCheck size={20} className="text-emerald-500" /> Quy định phòng thi</h2>
          <ul>
            <li>Không được phép thoát chế độ toàn màn hình hoặc chuyển tab.</li>
            <li>Hệ thống tự động nộp bài khi hết giờ.</li>
            <li>Kết quả sẽ được hiển thị ngay sau khi nộp bài.</li>
            {mode === 'official' ? (
              <li className="font-bold text-rose-600">Mỗi thí sinh chỉ có một lượt thi chính thức duy nhất.</li>
            ) : (
              <li>Bạn có thể thực hiện bài thi này nhiều lần để ôn luyện.</li>
            )}
          </ul>
        </div>

        <div className="warning-box">
          <AlertCircle size={20} />
          <p>
            {mode === 'official' 
              ? 'Bằng việc nhấn nút bắt đầu, thời gian thi chính thức của bạn sẽ được tính.' 
              : 'Đây là bài thi thử, kết quả sẽ không được ghi nhận vào bảng điểm chính thức.'}
          </p>
        </div>

        <button 
          className={`btn-start-exam ${mode === 'mock' ? 'btn-mock' : ''}`} 
          onClick={handleStartExam}
          disabled={loading}
        >
          {loading ? 'Đang khởi tạo...' : (
            <>{mode === 'mock' ? 'Bắt đầu Thi Thử' : 'Bắt đầu Thi Chính Thức'} <Play size={20} /></>
          )}
        </button>
        
        <button 
          className="btn-back mt-4 text-slate-500 font-medium text-sm flex items-center justify-center gap-2 hover:text-slate-800"
          onClick={() => navigate('/student/select-exam')}
          disabled={loading}
        >
           Quay lại chọn kỳ thi
        </button>
      </div>
    </div>
  );
};

export default StudentExamLanding;
