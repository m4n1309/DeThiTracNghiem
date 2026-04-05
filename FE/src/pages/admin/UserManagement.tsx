import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Edit2, UserPlus, Search, RefreshCcw, Lock, Unlock } from 'lucide-react';
import UserModal from './UserModal';
import Pagination from '../../components/common/Pagination';
import './UserManagement.css';


interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher';
  is_active: boolean;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const { token, logout } = useAuth();

  const fetchUsers = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/users?page=${page}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalItems(response.data.meta.totalItems);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Phiên làm việc hết hạn hoặc bạn không có quyền truy cập.');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const fetchUsersForAction = () => {
    fetchUsers(currentPage);
  };


  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`http://localhost:3001/api/users/${id}/toggle-status`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsersForAction();
    } catch (err: any) {
      console.error(err);
      alert('Không thể cập nhật trạng thái người dùng.');
    }
  };

  const handleResetPassword = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại mật khẩu về mặc định (123456)?')) {
      try {
        await axios.patch(`http://localhost:3001/api/users/${id}/reset-password`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Mật khẩu đã được đặt lại thành công.');
      } catch (err: any) {
        console.error(err);
        alert('Không thể đặt lại mật khẩu.');
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng này?')) {
      try {
        await axios.delete(`http://localhost:3001/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsersForAction();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Không thể xóa người dùng.');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-mgmt-container">
      <div className="user-mgmt-header">
        <h1 className="text-3xl font-bold">Quản Lý Người Dùng</h1>
        <div className="table-controls">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              className="search-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-user-btn flex items-center gap-2" onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
            <UserPlus className="w-5 h-5" />
            Thêm Người Dùng
          </button>
        </div>
      </div>

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>Họ Tên</th>
              <th>Username</th>
              <th>Email</th>
              <th>Vai Trò</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Đang tải dữ liệu...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Không tìm thấy người dùng nào.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.user_id}>
                  <td>
                    <div className="font-semibold">{user.full_name}</div>
                    <div className="text-xs text-slate-500">{user.phone || 'Không có sđt'}</div>
                  </td>
                  <td><code className="text-sm bg-[var(--bg-main)] text-[var(--primary)] px-2 py-1 rounded border border-[var(--border)]">{user.username}</code></td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-teacher'}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {user.is_active ? 'Đang hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn" title="Chỉnh sửa" onClick={() => { setEditingUser(user); setIsModalOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="action-btn" title="Reset mật khẩu" onClick={() => handleResetPassword(user.user_id)}>
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button
                      className={`action-btn ${user.is_active ? '' : 'text-green-500'}`}
                      title={user.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                    >
                      {user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button className="action-btn delete" title="Xóa vĩnh viễn" onClick={() => handleDeleteUser(user.user_id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>


      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchUsersForAction}
          token={token!}
        />
      )}
    </div>
  );
};

export default UserManagement;
