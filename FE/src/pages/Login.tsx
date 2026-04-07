import API_BASE_URL from '../config/api';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import { GraduationCap } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      const { token, user } = response.data;
      login(token, user);

      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-v2">
        <div className="login-header">
          <div className="brand-logo">
            <GraduationCap size={48} className="logo-icon" />
          </div>
          <h1 className="login-title">Hệ Thống Thi Trực Tuyến</h1>
          <p className="login-subtitle">Quản trị viên & Giảng viên</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form-v2">
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="admin / username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <div className="form-utils">
            <label className="remember-me">
              <input type="checkbox" /> Ghi nhớ đăng nhập
            </label>
            <button type="button" className="forgot-link">Quên mật khẩu?</button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-login-main"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="login-footer-v2">
          <span>Bạn là học viên?</span>
          <button
            onClick={() => navigate('/student-login')}
            className="btn-switch-login"
          >
            Đăng nhập thí sinh
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
