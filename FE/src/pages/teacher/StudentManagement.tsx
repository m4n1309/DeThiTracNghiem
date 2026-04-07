import API_BASE_URL from '../../config/api';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Upload,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Download
} from 'lucide-react';
import StudentImportPreviewModal, { type PreviewParticipant } from './StudentImportPreviewModal';
import Pagination from '../../components/common/Pagination';
import './StudentManagement.css';

interface Participant {
  participant_id: number;
  exam_id: number;
  exam_code: string;
  full_name: string;
  student_code: string | null;
  class_name: string | null;
  email: string | null;
}

interface Exam {
  exam_id: number;
  exam_name: string;
}

const StudentManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<number | ''>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    className: '',
    email: '',
    examCode: ''
  });

  const [importPreview, setImportPreview] = useState<PreviewParticipant[] | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token } = useAuth();

  const fetchExams = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(res.data.data || res.data); // Handle both old and new API response
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  }, [token]);

  const fetchParticipants = useCallback(async (page: number) => {
    if (!selectedExam || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/students?examId=${selectedExam}&page=${page}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipants(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.totalItems);
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedExam, token]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    if (selectedExam) {
      fetchParticipants(currentPage);
    } else {
      setParticipants([]);
    }
  }, [selectedExam, currentPage, fetchParticipants]);

  // Reset page when exam changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedExam]);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        await axios.put(`${API_BASE_URL}/students/${editingParticipant.participant_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/students`, { ...formData, examId: selectedExam }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsAddModalOpen(false);
      setEditingParticipant(null);
      setFormData({ fullName: '', studentCode: '', className: '', email: '', examCode: '' });
      fetchParticipants(currentPage);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thí sinh này?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchParticipants(currentPage);
    } catch (err: unknown) {
      console.error('Error deleting participant:', err);
      alert('Không thể xóa thí sinh');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;

    const postData = new FormData();
    postData.append('file', file);
    postData.append('examId', selectedExam.toString());

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/students/import-parse`, postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setImportPreview(response.data.participants);
      setIsImportModalOpen(true);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi phân tích file.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading template:', err);
      alert('Không thể tải file mẫu.');
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.student_code && p.student_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.exam_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-mgmt-container">
      <div className="mgmt-header">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="text-blue-500" />
            Quản lý học viên
          </h1>
          <p className="text-slate-400 mt-1">Danh sách thí sinh tham gia các kỳ thi</p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary flex items-center gap-2"
            onClick={() => setIsBulkModalOpen(true)}
            disabled={!selectedExam}
          >
            <Upload size={18} /> Nhập hàng loạt
          </button>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => {
              setEditingParticipant(null);
              setFormData({ fullName: '', studentCode: '', className: '', email: '', examCode: '' });
              setIsAddModalOpen(true);
            }}
            disabled={!selectedExam}
          >
            <UserPlus size={18} /> Thêm thí sinh
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="flex gap-6 items-end flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-bold text-slate-500 mb-2 uppercase letter-spacing-1">Chọn kỳ thi</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(Number(e.target.value))}
              className="filter-select w-full"
            >
              <option value="">-- Tất cả kỳ thi --</option>
              {exams.map(exam => (
                <option key={exam.exam_id} value={exam.exam_id}>{exam.exam_name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[300px] relative">
            <label className="block text-sm font-bold text-slate-500 mb-2 uppercase letter-spacing-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                className="filter-select pl-10 w-full"
                placeholder="Tên, mã SV hoặc SBD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="question-list-wrapper">
        {!selectedExam ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Vui lòng chọn một kỳ thi để quản lý thí sinh</p>
          </div>
        ) : loading ? (
          <div className="p-16 text-center">
            <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-500">Đang tải dữ liệu thí sinh...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
            <Users size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Chưa có thí sinh nào trong kỳ thi này</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="question-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>SBD</th>
                    <th>Họ và tên</th>
                    <th style={{ width: '150px' }}>Mã sinh viên</th>
                    <th style={{ width: '150px' }}>Lớp</th>
                    <th>Email</th>
                    <th style={{ width: '120px' }} className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map(p => (
                    <tr key={p.participant_id}>
                      <td><span className="sbd-badge">{p.exam_code}</span></td>
                      <td className="font-bold text-slate-700">{p.full_name}</td>
                      <td>{p.student_code || '-'}</td>
                      <td>{p.class_name || '-'}</td>
                      <td className="text-slate-500 text-sm">{p.email || '-'}</td>
                      <td>
                        <div className="action-cell">
                          <button
                            className="action-btn"
                            onClick={() => {
                              setEditingParticipant(p);
                              setFormData({
                                fullName: p.full_name,
                                studentCode: p.student_code || '',
                                className: p.class_name || '',
                                email: p.email || '',
                                examCode: p.exam_code
                              });
                              setIsAddModalOpen(true);
                            }}
                            title="Sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(p.participant_id)} title="Xóa">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="student-modal-overlay">
          <div className="student-modal-content">
            <div className="student-modal-header">
              <h2>{editingParticipant ? 'Sửa thông tin thí sinh' : 'Thêm thí sinh mới'}</h2>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleAddOrUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mã sinh viên</label>
                  <input
                    type="text"
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Lớp</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Số báo danh (Để trống để tự động sinh)</label>
                  <input
                    type="text"
                    value={formData.examCode}
                    placeholder="VD: SBD-001"
                    onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="student-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept=".xlsx, .xls"
        onChange={handleFileChange}
      />

      {isImportModalOpen && importPreview && selectedExam && (
        <StudentImportPreviewModal
          participants={importPreview}
          examId={Number(selectedExam)}
          token={token!}
          onClose={() => setIsImportModalOpen(false)}
          onRefresh={() => fetchParticipants(currentPage)}
        />
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="student-modal-overlay">
          <div className="student-modal-content bulk-modal">
            <div className="student-modal-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <Upload size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Nhập danh sách thí sinh</h2>
                  <p className="text-sm text-slate-500">Tải lên file Excel để ghi danh nhanh</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsBulkModalOpen(false)}><X /></button>
            </div>
            <div className="student-modal-body">
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-blue-400 transition-colors">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-500 rounded-full">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-bold mb-2">Chọn file Excel của bạn</h3>
                <p className="text-slate-500 text-sm mb-6">Chấp nhận định dạng .xlsx hoặc .xls</p>

                <div className="flex justify-center gap-4">
                  <button
                    className="btn btn-secondary flex items-center gap-2"
                    onClick={downloadTemplate}
                  >
                    <Download size={18} /> Tải file mẫu
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setIsBulkModalOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    Tải lên file dữ liệu
                  </button>
                </div>
              </div>
            </div>
            <div className="student-modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsBulkModalOpen(false)}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
