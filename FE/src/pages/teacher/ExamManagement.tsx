import API_BASE_URL from '../../config/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Search,
  Clock,
  Target,
  Calendar,
  X,
  Settings2,
  BarChart3
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import './ExamManagement.css';


interface Exam {
  exam_id: number;
  exam_name: string;
  subject_id: number;
  subject_name: string;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  total_points: number;
  allow_practice: boolean;
  practice_limit: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  start_time: string | null;
  end_time: string | null;
  creator_name: string;
  show_results: boolean;
}

interface Subject {
  subject_id: number;
  subject_name: string;
}

const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 6; // Grid layout looks better with 6 or 9


  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState({
    exam_name: '',
    subject_id: '' as number | '',
    duration_minutes: 60,
    total_questions: 40,
    passing_score: 5.0,
    total_points: 10.0,
    start_time: '',
    end_time: '',
    allow_practice: false,
    practice_limit: 0,
    shuffle_questions: false,
    shuffle_options: true,
    show_results: true
  });

  const [bankStats, setBankStats] = useState({ total: 0 });

  const { token } = useAuth();

  const fetchBankStats = useCallback(async (subjectId: number) => {
    try {
      const resStats = await axios.get(`${API_BASE_URL}/exams/stats/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBankStats(resStats.data);
    } catch (err) {
      console.error('Error fetching bank stats:', err);
    }
  }, [token]);

  const fetchExams = useCallback(async (page: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/exams?page=${page}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.totalItems);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExams(currentPage);
  }, [fetchExams, currentPage]);


  const fetchSubjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle potential pagination or direct array
      const subjectData = res.data.data || res.data;
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);


  useEffect(() => {
    if (formData.subject_id) {
      fetchBankStats(Number(formData.subject_id));
    } else {
      setBankStats({ total: 0 });
    }
  }, [formData.subject_id, fetchBankStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingExam) {
        await axios.put(`${API_BASE_URL}/exams/${editingExam.exam_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/exams`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      fetchExams(currentPage);
    } catch (err: unknown) {

      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra khi lưu kỳ thi';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kỳ thi này?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchExams(currentPage);
    } catch {

      alert('Không thể xóa kỳ thi');
    }
  };

  const filteredExams = exams.filter(e =>
    e.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="exam-mgmt-container">
      <div className="mgmt-header">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings2 className="text-blue-500" />
            Cấu hình Kỳ thi
          </h1>
          <p className="text-slate-400 mt-1">Thiết lập quy tắc tạo đề thi ngẫu nhiên và quản lý thời gian thi</p>
        </div>

        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => {
            setEditingExam(null);
            setFormData({
              exam_name: '',
              subject_id: '',
              duration_minutes: 60,
              total_questions: 40,
              passing_score: 5.0,
              total_points: 10.0,
              start_time: '',
              end_time: '',
              allow_practice: false,
              practice_limit: 0,
              shuffle_questions: false,
              shuffle_options: true,
              show_results: true
            });
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} /> Tạo kỳ thi mới
        </button>
      </div>

      <div className="search-bar-wrapper">
        <div className="search-input-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm kỳ thi, môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="exams-grid">
        {loading ? (
          <div className="loading-state">Đang tải danh sách kỳ thi...</div>
        ) : filteredExams.length === 0 ? (
          <div className="empty-state">Chưa có kỳ thi nào được cấu hình.</div>
        ) : (
          filteredExams.map(exam => (
            <div key={exam.exam_id} className="exam-card">
              <div className="exam-card-header">
                <div className="subject-badge">{exam.subject_name}</div>
                <div className="card-actions">
                  <button className="card-btn edit" onClick={() => {
                    setEditingExam(exam);
                    setFormData({
                      exam_name: exam.exam_name,
                      subject_id: exam.subject_id,
                      duration_minutes: exam.duration_minutes,
                      total_questions: exam.total_questions,
                      passing_score: exam.passing_score,
                      total_points: exam.total_points || 10.0,
                      start_time: exam.start_time ? exam.start_time.slice(0, 16) : '',
                      end_time: exam.end_time ? exam.end_time.slice(0, 16) : '',
                      allow_practice: Boolean(exam.allow_practice),
                      practice_limit: exam.practice_limit,
                      shuffle_questions: Boolean(exam.shuffle_questions),
                      shuffle_options: Boolean(exam.shuffle_options),
                      show_results: exam.show_results !== undefined ? Boolean(exam.show_results) : true
                    });
                    setIsModalOpen(true);
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="card-btn delete" onClick={() => handleDelete(exam.exam_id)}>
                    <Trash2 size={16} />
                  </button>
                  <button
                    className="card-btn edit"
                    title="Xem kết quả"
                    onClick={() => navigate(isAdmin ? `/admin/results/${exam.exam_id}` : `/teacher/results/${exam.exam_id}`)}
                  >
                    <BarChart3 size={16} className="text-emerald-400" />
                  </button>
                </div>
              </div>

              <h3 className="exam-title">{exam.exam_name}</h3>

              <div className="exam-info-grid">
                <div className="info-item">
                  <Clock size={16} />
                  <span>{exam.duration_minutes} phút</span>
                </div>
                <div className="info-item">
                  <ClipboardList size={16} />
                  <span>{exam.total_questions} câu hỏi</span>
                </div>
                <div className="info-item">
                  <Target size={16} />
                  <span>Điểm đạt: {exam.passing_score}</span>
                </div>
              </div>

              <div className="exam-schedule">
                <div className="schedule-item">
                  <Calendar size={14} className="text-blue-400" />
                  <span>Bắt đầu: {exam.start_time ? new Date(exam.start_time).toLocaleString('vi-VN') : 'N/A'}</span>
                </div>
                <div className="schedule-item">
                  <Calendar size={14} className="text-rose-400" />
                  <span>Kết thúc: {exam.end_time ? new Date(exam.end_time).toLocaleString('vi-VN') : 'N/A'}</span>
                </div>
              </div>

              <div className="exam-card-footer">
                <span className="creator">Tạo bởi: {exam.creator_name}</span>
                {exam.allow_practice && <span className="practice-tag">Cho phép thi thử</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination-wrapper-grid">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>


      {/* Exam Configuration Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="exam-modal-content">
            <div className="exam-modal-header">
              <h2>{editingExam ? 'Chỉnh sửa kỳ thi' : 'Cấu hình kỳ thi mới'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="exam-modal-body scrollable">
                <div className="exam-config-unified">
                  {/* Thông tin chung */}
                  <div className="exam-config-group">
                    <div className="form-group">
                      <label>Tên kỳ thi <span className="required">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.exam_name}
                        onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                        placeholder="VD: Thi giữa kỳ II - Lập trình Web"
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Môn học <span className="required">*</span></label>
                        <select
                          required
                          value={formData.subject_id}
                          onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                        >
                          <option value="">Chọn môn học</option>
                          {subjects.map(s => (
                            <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Thời gian làm bài (Phút)</label>
                        <div className="input-icon-wrapper">
                          <input
                            type="number"
                            required
                            value={formData.duration_minutes}
                            onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                          />
                          <Clock className="input-icon-right" size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Thời gian bắt đầu</label>
                        <input
                          type="datetime-local"
                          value={formData.start_time}
                          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Thời gian kết thúc</label>
                        <input
                          type="datetime-local"
                          value={formData.end_time}
                          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Tổng số câu hỏi <span className="required">*</span></label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={formData.total_questions}
                          onChange={(e) => setFormData({ ...formData, total_questions: Number(e.target.value) })}
                          placeholder="Nhập số câu hỏi"
                        />
                        {formData.subject_id ? (
                          <span className="field-hint">Ngân hàng hiện có: <strong>{bankStats.total}</strong> câu</span>
                        ) : null}
                      </div>
                      <div className="form-group">
                        <label>Điểm đạt (trên 10) <span className="required">*</span></label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={formData.passing_score}
                          onChange={(e) => setFormData({ ...formData, passing_score: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tùy chọn nâng cao */}
                  <div className="exam-config-group advanced-group">
                    <h4 className="exam-config-group-title">
                      <Settings2 size={18} /> Tùy chọn nâng cao
                    </h4>
                    <div className="adv-options-grid">
                      <label className="adv-option-card">
                        <input
                          type="checkbox"
                          checked={formData.allow_practice}
                          onChange={(e) => setFormData({ ...formData, allow_practice: e.target.checked })}
                        />
                        <span className="adv-checkbox"></span>
                        <div className="adv-option-text">
                          <strong>Cho phép làm bài thử</strong>
                          <span>Học sinh có thể làm thử trước khi thi chính thức</span>
                        </div>
                      </label>

                      <label className="adv-option-card">
                        <input
                          type="checkbox"
                          checked={formData.shuffle_questions}
                          onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                        />
                        <span className="adv-checkbox"></span>
                        <div className="adv-option-text">
                          <strong>Xáo trộn câu hỏi</strong>
                          <span>Thứ tự câu hỏi sẽ khác nhau với mỗi học sinh</span>
                        </div>
                      </label>

                      <label className="adv-option-card">
                        <input
                          type="checkbox"
                          checked={formData.shuffle_options}
                          onChange={(e) => setFormData({ ...formData, shuffle_options: e.target.checked })}
                        />
                        <span className="adv-checkbox"></span>
                        <div className="adv-option-text">
                          <strong>Xáo trộn đáp án</strong>
                          <span>Vị trí A, B, C, D sẽ được thay đổi ngẫu nhiên</span>
                        </div>
                      </label>

                      <label className="adv-option-card">
                        <input
                          type="checkbox"
                          checked={formData.show_results}
                          onChange={(e) => setFormData({ ...formData, show_results: e.target.checked })}
                        />
                        <span className="adv-checkbox"></span>
                        <div className="adv-option-text">
                          <strong>Hiển thị kết quả sau thi</strong>
                          <span>Học sinh xem được điểm và đáp án ngay khi nộp</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="exam-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu cấu hình</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
