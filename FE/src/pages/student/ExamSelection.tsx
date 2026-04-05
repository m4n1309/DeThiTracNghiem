import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ClipboardList, 
  Clock, 
  ArrowRight, 
  Gamepad2, 
  Calendar,
  AlertCircle,
  LogOut
} from 'lucide-react';
import './ExamSelection.css';
import ConfirmModal from '../../components/common/ConfirmModal';

const ExamSelection: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [modalConfig, setModalConfig] = React.useState<{
    isOpen: boolean;
    exam: { exam_id: number; exam_name: string; participant_id: number; allow_practice: boolean } | null;
    mode: 'mock' | 'official';
  }>({
    isOpen: false,
    exam: null,
    mode: 'official'
  });

  const handleLogout = () => {
    logout();
    navigate('/student-login');
  };

  if (!user || !user.availableExams) {
    return <div className="p-10 text-center">Đang tải danh sách kỳ thi...</div>;
  }

  const handleSelectExamMode = (exam: { exam_id: number; exam_name: string; participant_id: number; allow_practice: boolean }, mode: 'mock' | 'official') => {
    setModalConfig({
      isOpen: true,
      exam,
      mode
    });
  };

  const handleConfirmStart = () => {
    const { exam, mode } = modalConfig;
    setModalConfig({ ...modalConfig, isOpen: false });
    navigate('/student/exam-landing', { state: { selectedExam: exam, mode } });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="selection-container">
      <div className="selection-header">
        <div className="user-welcome">
          <h1>Chào mừng, {user.fullName}</h1>
          <p className="text-slate-400">Chọn kỳ thi bạn muốn tham gia (SBD: {user.examCode})</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>

      {user.availableExams.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} className="text-slate-300" />
          <p>Hiện không có kỳ thi nào đang diễn ra dành cho bạn.</p>
        </div>
      ) : (
        <div className="exam-cards-grid">
          {user.availableExams.map((exam) => {
            const now = new Date();
            const start = new Date(exam.start_time);
            const end = new Date(exam.end_time);
            const isActive = now >= start && now <= end;
            const isFuture = now < start;

            return (
              <div key={exam.exam_id} className={`exam-card ${!isActive ? 'inactive' : ''}`}>
                <div className="exam-card-header">
                  <div className="exam-icon-wrapper">
                    <ClipboardList size={24} />
                  </div>
                  <div className="exam-status">
                    {isActive ? (
                      <span className="badge badge-active font-bold">Đang diễn ra</span>
                    ) : isFuture ? (
                      <span className="badge badge-future font-bold">Chưa bắt đầu</span>
                    ) : (
                      <span className="badge badge-expired font-bold">Đã kết thúc</span>
                    )}
                  </div>
                </div>
                
                <h3 className="exam-title">{exam.exam_name}</h3>
                
                <div className="exam-details">
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>{formatDate(exam.start_time)}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>Đến {formatDate(exam.end_time)}</span>
                  </div>
                </div>

                <div className="exam-actions">
                  {exam.allow_practice && (
                    <button 
                      className="btn-mode mode-practice"
                      onClick={() => handleSelectExamMode(exam, 'mock')}
                      title="Làm thử không tính điểm"
                    >
                      <Gamepad2 size={18} /> Thi thử
                    </button>
                  )}
                  <button 
                    className={`btn-mode mode-official ${!isActive ? 'disabled' : ''}`}
                    onClick={() => isActive && handleSelectExamMode(exam, 'official')}
                    disabled={!isActive}
                  >
                    Thi chính thức <ArrowRight size={18} />
                  </button>
                </div>
                
                {!isActive && isFuture && (
                  <p className="time-warning">Kỳ thi sẽ mở lúc {formatDate(exam.start_time)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.mode === 'official' ? 'Xác nhận thi chính thức' : 'Xác nhận thi thử'}
        message={
          modalConfig.mode === 'official'
            ? `Bạn đang chuẩn bị bắt đầu bài thi chính thức cho "${modalConfig.exam?.exam_name}". Lưu ý: Bạn chỉ có DUY NHẤT một lượt thi này. Bạn đã sẵn sàng chưa?`
            : `Bạn sắp bắt đầu bài thi thử cho "${modalConfig.exam?.exam_name}". Đây là lượt luyện tập, kết quả sẽ không tính vào điểm chính thức.`
        }
        type={modalConfig.mode === 'official' ? 'warning' : 'info'}
        onConfirm={handleConfirmStart}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmText="Bắt đầu ngay"
        cancelText="Để sau"
      />
    </div>
  );
};

export default ExamSelection;
