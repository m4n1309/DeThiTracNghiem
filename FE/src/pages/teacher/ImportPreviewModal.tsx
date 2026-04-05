import React from 'react';
import { X, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import axios from 'axios';

export interface PreviewQuestion {
  stt: number;
  questionText: string;
  options: string[];
  correctOption: string;
  subjectId: number | null;
  subjectName: string;
  points: number;
  isValid: boolean;
  errors: string[];
}

interface ImportPreviewModalProps {
  questions: PreviewQuestion[];
  onClose: () => void;
  onRefresh: () => void;
  token: string;
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({ questions, onClose, onRefresh, token }) => {
  const [loading, setLoading] = React.useState(false);

  const validCount = questions.filter(q => q.isValid).length;
  const invalidCount = questions.length - validCount;

  const handleConfirm = async () => {
    if (validCount === 0) return;
    
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/questions/import-confirm', 
        { questions }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Đã nhập thành công ${validCount} câu hỏi.`);
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error confirming import:', err);
      alert('Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2 className="flex items-center gap-2">
            <Download size={24} className="text-blue-500" />
            Xem trước dữ liệu Import
          </h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-body scrollable">
          <div className="import-summary mb-6 flex gap-4">
            <div className="summary-card flex-1 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" />
              <div>
                <div className="text-sm text-emerald-600 font-medium">Hợp lệ</div>
                <div className="text-2xl font-bold text-emerald-700">{validCount} câu hỏi</div>
              </div>
            </div>
            <div className="summary-card flex-1 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-rose-500" />
              <div>
                <div className="text-sm text-rose-600 font-medium">Lỗi</div>
                <div className="text-2xl font-bold text-rose-700">{invalidCount} câu hỏi</div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="question-table preview-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th>Câu hỏi</th>
                  <th>Danh sách đáp án</th>
                  <th>Môn học</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr key={idx} className={!q.isValid ? 'row-invalid' : ''}>
                    <td className="text-center">{q.stt}</td>
                    <td>
                      <div className="question-text-preview font-medium">{q.questionText}</div>
                      {!q.isValid && (
                        <div className="error-messages mt-2">
                          {q.errors.map((err, i) => (
                            <div key={i} className="text-xs text-rose-500 flex items-center gap-1">
                              <AlertCircle size={12} /> {err}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="options-preview text-xs grid grid-cols-2 gap-x-2 gap-y-1">
                        {q.options.map((opt, i) => {
                          const label = String.fromCharCode(65 + i);
                          const isCorrect = q.correctOption === label;
                          return (
                            <span key={i} className={isCorrect ? 'text-blue-600 font-bold' : 'text-slate-500'}>
                              {label}: {(opt !== undefined && opt !== null && opt.toString().trim() !== '') ? opt : '(Trống)'}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="text-sm">{q.subjectName}</td>
                    <td className="text-center">
                      {q.isValid ? (
                        <CheckCircle2 className="text-emerald-500 mx-auto" size={20} />
                      ) : (
                        <AlertCircle className="text-rose-500 mx-auto" size={20} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm} 
            disabled={loading || validCount === 0}
          >
            {loading ? 'Đang lưu...' : `Xác nhận lưu ${validCount} câu hỏi`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
