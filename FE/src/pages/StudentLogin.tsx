import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './StudentLogin.css';
import { GraduationCap } from 'lucide-react';

const StudentLogin: React.FC = () => {
  const [examCode, setExamCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3001/api/auth/student-login', {
        examCode
      });

      const { token, user } = response.data;
      login(token, user);

      // If multiple exams or we want to show selection, go to selection page
      navigate('/student/select-exam');
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại Số Báo Danh.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-login-container">
      <div className="login-card-v2">
        <div className="student-login-header">
          <div className="brand-logo">
            <GraduationCap size={48} className="logo-icon" />
          </div>
          <h1 className="login-title">Thí Sinh Vào Thi</h1>
          <p className="login-subtitle">Nhập Số Báo Danh để bắt đầu bài thi của bạn</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleStudentLogin} className="login-form-v2">
          <div className="form-group">
            <label className="form-label">Số Báo Danh</label>
            <input
              type="text"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              required
              autoFocus
              className="form-input"
              placeholder="SBDXXXXX"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-login-main"
          >
            {loading ? 'Đang kiểm tra...' : 'Bắt Đầu Làm Bài'}
          </button>
        </form>

        <div className="login-footer-v2">
          <span>Bạn là quản trị viên?</span>
          <button
            onClick={() => navigate('/login')}
            className="btn-switch-login"
          >
            Đăng nhập quản lý
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
