import API_BASE_URL from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User } from 'lucide-react';

interface UserModalProps {
  user: any;
  onClose: () => void;
  onRefresh: () => void;
  token: string;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onRefresh, token }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'teacher'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        fullName: user.full_name,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = user 
        ? `${API_BASE_URL}/users/${user.user_id}` 
        : `${API_BASE_URL}/users`;
      
      const method = user ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="user-modal-header">
          <h2>{user ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="user-modal-body scrollable">
            {error && <div className="bg-red-50 border border-red-200 text-[var(--secondary-red)] p-4 rounded-xl mb-4 text-sm font-medium">{error}</div>}

            <div className="user-config-group">
              <div className="user-config-group-title">
                <User size={18} /> Thông tin người dùng
              </div>

              {!user && (
                <div className="form-group">
                  <label>Tên đăng nhập (Username)</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Ví dụ: nva_gv1"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Họ và Tên</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="gv@example.com"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="09xx xxx xxx"
                />
              </div>

              <div className="form-group">
                <label>Vai trò</label>
                <select 
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="teacher">Giảng Viên (Teacher)</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                </select>
              </div>

              {!user && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Mật khẩu mặc định: <strong className="text-[var(--text-main)]">123456</strong>
                </p>
              )}
            </div>
          </div>

          <div className="user-modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 bg-white hover:bg-[var(--bg-main)] text-[var(--text-main)] font-bold rounded-xl transition-all border border-[var(--border)]"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              {loading ? 'Đang lưu...' : user ? 'Cập Nhật' : 'Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>

  );
};

export default UserModal;
