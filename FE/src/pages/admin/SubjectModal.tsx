import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2 } from 'lucide-react';

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description: string;
  teacher_names: string;
  teacher_ids: number[];
  created_at: string;
}

interface SubjectModalProps {
  subject: Subject | null;
  onClose: () => void;
  onRefresh: () => void;
  token: string;
}

interface Teacher {
  user_id: number;
  full_name: string;
  username: string;
  role: string;
}

const SubjectModal: React.FC<SubjectModalProps> = ({ subject, onClose, onRefresh, token }) => {
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    description: '',
    teacherIds: [] as number[]
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeachers, setFetchingTeachers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch available teachers
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/users?page=1&limit=100', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter only teachers and active admins
        const userList: Teacher[] = response.data.data || [];
        setTeachers(userList.filter(u => u.role === 'teacher' || u.role === 'admin' || (u as any).role === 'admin'));
      } catch (err) {
        console.error('Error fetching teachers:', err);
      } finally {
        setFetchingTeachers(false);
      }
    };
    fetchTeachers();

    // 2. Set initial form data if editing
    if (subject) {
      setFormData({
        subjectCode: subject.subject_code,
        subjectName: subject.subject_name,
        description: subject.description || '',
        teacherIds: subject.teacher_ids || []
      });
    }
  }, [subject, token]);

  const toggleTeacher = (id: number) => {
    setFormData(prev => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(id)
        ? prev.teacherIds.filter(tId => tId !== id)
        : [...prev.teacherIds, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.teacherIds.length === 0) {
      setError('Vui lòng chọn ít nhất một giảng viên phụ trách.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = subject 
        ? `http://localhost:3001/api/subjects/${subject.subject_id}` 
        : 'http://localhost:3001/api/subjects';
      
      const method = subject ? 'put' : 'post';

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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-[var(--text-main)]">{subject ? 'Chỉnh Sửa Môn Học' : 'Thêm Môn Học Mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-main)] rounded-full transition-colors text-[var(--text-muted)]">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-[var(--secondary-red)] p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-1">
              <label className="form-label">Mã Môn Học</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={formData.subjectCode}
                onChange={(e) => setFormData({...formData, subjectCode: e.target.value})}
                placeholder="Ví dụ: IT101"
              />
            </div>
            
            <div className="form-group col-span-1">
              <label className="form-label">Tên Môn Học</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={formData.subjectName}
                onChange={(e) => setFormData({...formData, subjectName: e.target.value})}
                placeholder="Ví dụ: Lập trình C++"
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Mô Tả</label>
              <textarea 
                className="form-input min-h-[80px]" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Thông tin giới thiệu về môn học..."
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label mb-2 block">Giảng Viên Phụ Trách (Chọn nhiều)</label>
              <div className="multi-select-container">
                {fetchingTeachers ? (
                  <p className="p-4 text-center text-[var(--text-light)] italic">Đang tải danh sách giảng viên...</p>
                ) : teachers.length === 0 ? (
                  <p className="p-4 text-center text-[var(--secondary-red)]">Không có giảng viên nào để gán.</p>
                ) : (
                  teachers.map(teacher => (
                    <label key={teacher.user_id} className="checkbox-item">
                      <input 
                        type="checkbox" 
                        checked={formData.teacherIds.includes(teacher.user_id)}
                        onChange={() => toggleTeacher(teacher.user_id)}
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="font-bold text-[var(--text-main)]">{teacher.full_name}</span>
                        <span className="text-xs text-[var(--text-muted)]">@{teacher.username}</span>
                      </div>
                      {formData.teacherIds.includes(teacher.user_id) && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 bg-[var(--bg-main)] hover:bg-[var(--border)] text-[var(--text-main)] font-bold rounded-xl transition-all border border-[var(--border)]"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading || fetchingTeachers}
              className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {loading ? 'Đang lưu...' : subject ? 'Cập Nhật' : 'Tạo Môn Học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;
