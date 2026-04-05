import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Edit2, Trash2, Filter, BookOpen, Download, Eye, X, Upload, CheckCircle } from 'lucide-react';
import QuestionModal from './QuestionModal';
import ImportPreviewModal from './ImportPreviewModal';
import type { PreviewQuestion } from './ImportPreviewModal';
import Pagination from '../../components/common/Pagination';
import './QuestionBank.css';

interface Subject {
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

interface Question {
  question_id: number;
  subject_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

const QuestionBank: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const { token } = useAuth();

  // Import states
  const [importPreview, setImportPreview] = useState<PreviewQuestion[] | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch subjects assigned to current user
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/questions/my-subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects(response.data);
        if (response.data.length > 0 && !selectedSubject) {
          setSelectedSubject(response.data[0].subject_id);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, [token, selectedSubject]);

  // 2. Fetch questions whenever subject or page changes
  const fetchQuestions = useCallback(async (page: number) => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/questions?subjectId=${selectedSubject}&page=${page}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalItems(response.data.meta.totalItems);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, token]);

  useEffect(() => {
    fetchQuestions(currentPage);
  }, [fetchQuestions, currentPage]);

  // Reset page when subject changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubject]);

  const fetchQuestionsForAction = () => {
    fetchQuestions(currentPage);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      try {
        await axios.delete(`http://localhost:3001/api/questions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchQuestionsForAction();
      } catch (err) {
        console.error(err);
        alert('Không thể xóa câu hỏi.');
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/questions/template', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'question_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading template:', err);
      alert('Không thể tải tệp mẫu.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/questions/import-parse', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setImportPreview(response.data.questions);
      setIsImportModalOpen(true);
    } catch (err) {
      console.error('Error parsing import file:', err);
      alert('Không thể đọc tệp Excel. Vui lòng kiểm tra lại định dạng.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filter questions by search query (frontend search on current page)
  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="question-bank-container">
      {/* Header */}
      <div className="qb-header">
        <div>
          <h1>Ngân hàng câu hỏi</h1>
          <p className="qb-subtitle">Quản lý và tổ chức kho câu hỏi trắc nghiệm của bạn</p>
        </div>
        <div className="header-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={handleDownloadTemplate}
            title="Tải tệp mẫu"
          >
            <Download size={18} /> Mẫu Excel
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} /> Import
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }}
            disabled={!selectedSubject}
          >
            <PlusCircle size={18} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="qb-filter-bar">
        <div className="qb-search-box">
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi, môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="qb-search-input"
          />
        </div>
        <div className="qb-filter-group">
          <Filter size={16} />
          <select
            className="qb-filter-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(Number(e.target.value))}
          >
            <option value="">Tất cả môn học</option>
            {subjects.map(s => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question Table */}
      <div className="qb-table-wrapper">
        {loading ? (
          <div className="qb-empty-state">
            <div className="loading-spinner"></div>
            <p>Đang tải câu hỏi...</p>
          </div>
        ) : !selectedSubject ? (
          <div className="qb-empty-state">
            <BookOpen size={48} strokeWidth={1.5} />
            <p>Vui lòng chọn môn học để xem danh sách câu hỏi.</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="qb-empty-state">
            <BookOpen size={48} strokeWidth={1.5} />
            <p>Môn học này chưa có câu hỏi nào.</p>
          </div>
        ) : (
          <>
            <table className="qb-table">
              <thead>
                <tr>
                  <th>Nội dung câu hỏi</th>
                  <th style={{ width: '140px' }}>Môn học</th>
                  <th style={{ width: '100px' }}>Cập nhật</th>
                  <th style={{ width: '130px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr key={q.question_id}>
                    <td>
                      <div className="qb-question-cell">
                        <span className="qb-question-text">{q.question_text}</span>
                        <div className="qb-question-tags">
                          <span className="qb-tag type">SINGLE CHOICE</span>
                          <span className="qb-tag id">#Q-{String(q.question_id).padStart(4, '0')}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="qb-subject-name">
                        {subjects.find(s => s.subject_id === q.subject_id)?.subject_name || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="qb-date">Gần đây</span>
                    </td>
                    <td>
                      <div className="qb-actions">
                        <button
                          className="qb-action-btn view"
                          onClick={() => setViewingQuestion(q)}
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="qb-action-btn edit"
                          onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }}
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="qb-action-btn delete"
                          onClick={() => handleDelete(q.question_id)}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
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

      {/* Question Detail Modal */}
      {viewingQuestion && (
        <div className="qb-detail-overlay" onClick={() => setViewingQuestion(null)}>
          <div className="qb-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qb-detail-header">
              <h2>Chi tiết câu hỏi</h2>
              <button className="qb-detail-close" onClick={() => setViewingQuestion(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="qb-detail-body">
              <div className="qb-detail-meta">
                <span className="qb-tag type">SINGLE CHOICE</span>
                <span className="qb-tag id">#Q-{String(viewingQuestion.question_id).padStart(4, '0')}</span>
                <span className="qb-tag subject">
                  {subjects.find(s => s.subject_id === viewingQuestion.subject_id)?.subject_name || 'N/A'}
                </span>
              </div>
              <div className="qb-detail-question">
                <h3>Câu hỏi:</h3>
                <p>{viewingQuestion.question_text}</p>
              </div>
              <div className="qb-detail-options">
                <h3>Các đáp án:</h3>
                {['A', 'B', 'C', 'D'].map((key) => {
                  const optionKey = `option_${key.toLowerCase()}` as keyof Question;
                  const optionValue = viewingQuestion[optionKey] as string;
                  const isCorrect = viewingQuestion.correct_option === key;
                  return (
                    <div key={key} className={`qb-option-item ${isCorrect ? 'correct' : ''}`}>
                      <div className="qb-option-letter">{key}</div>
                      <div className="qb-option-text">{optionValue || '(Trống)'}</div>
                      {isCorrect && (
                        <div className="qb-option-correct">
                          <CheckCircle size={16} /> Đáp án đúng
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="qb-detail-footer">
              <button className="btn btn-secondary" onClick={() => setViewingQuestion(null)}>
                Đóng
              </button>
              <button className="btn btn-primary" onClick={() => {
                setEditingQuestion(viewingQuestion);
                setViewingQuestion(null);
                setIsModalOpen(true);
              }}>
                <Edit2 size={16} /> Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <QuestionModal
          question={editingQuestion}
          subjectId={Number(selectedSubject)}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchQuestionsForAction}
          token={token!}
        />
      )}

      {isImportModalOpen && importPreview && (
        <ImportPreviewModal
          questions={importPreview}
          token={token!}
          onClose={() => setIsImportModalOpen(false)}
          onRefresh={fetchQuestionsForAction}
        />
      )}
    </div>
  );
};

export default QuestionBank;
