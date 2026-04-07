import API_BASE_URL from '../../config/api';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Edit2, BookOpen, Search, Users, PlusCircle } from 'lucide-react';
import SubjectModal from './SubjectModal';
import Pagination from '../../components/common/Pagination';
import './SubjectManagement.css';

import './UserManagement.css'; // Reuse table styles

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description: string;
  teacher_names: string;
  teacher_ids: number[];
  created_at: string;
}

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const { token, logout } = useAuth();

  const fetchSubjects = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects?page=${page}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalItems(response.data.meta.totalItems);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchSubjects(currentPage);
  }, [fetchSubjects, currentPage]);

  const fetchSubjectsForAction = () => {
    fetchSubjects(currentPage);
  };




  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA môn học này?')) {
      try {
        await axios.delete(`${API_BASE_URL}/subjects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSubjectsForAction();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Không thể xóa môn học.');
      }
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="subject-mgmt-container">
      <div className="subject-mgmt-header">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="text-indigo-500" />
          Quản Lý Môn Học
        </h1>
        <div className="table-controls">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên môn..."
              className="search-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-user-btn flex items-center gap-2" onClick={() => { setEditingSubject(null); setIsModalOpen(true); }}>
            <PlusCircle className="w-5 h-5" />
            Thêm Môn Học
          </button>
        </div>
      </div>

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>Mã Môn</th>
              <th>Tên Môn Học</th>
              <th>Giảng Viên Phụ Trách</th>
              <th>Mô Tả</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Đang tải dữ liệu...</td></tr>
            ) : filteredSubjects.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Không tìm thấy môn học nào.</td></tr>
            ) : (
              filteredSubjects.map(subject => (
                <tr key={subject.subject_id}>
                  <td><span className="subject-code-badge">{subject.subject_code}</span></td>
                  <td className="font-bold text-[var(--text-main)] text-lg">{subject.subject_name}</td>
                  <td>
                    <div className="teacher-tag-container">
                      {subject.teacher_names ? (
                        subject.teacher_names.split(', ').map((name, idx) => (
                          <span key={idx} className="teacher-tag flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-muted)] italic text-sm">Chưa gán giảng viên</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-[var(--text-muted)] line-clamp-1" title={subject.description}>
                      {subject.description || 'N/A'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="actions-wrapper">
                      <button className="action-btn" title="Sửa" onClick={() => { setEditingSubject(subject); setIsModalOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="action-btn delete" title="Xóa" onClick={() => handleDelete(subject.subject_id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
        <SubjectModal
          subject={editingSubject}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchSubjectsForAction}
          token={token!}
        />
      )}
    </div>
  );
};

export default SubjectManagement;
