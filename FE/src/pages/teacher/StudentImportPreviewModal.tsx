import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import axios from 'axios';

export interface PreviewParticipant {
  stt: number;
  fullName: string;
  studentCode: string;
  className: string;
  email: string;
  examCode: string;
  isValid: boolean;
  errors: string[];
}

interface StudentImportPreviewModalProps {
  participants: PreviewParticipant[];
  examId: number;
  token: string;
  onClose: () => void;
  onRefresh: () => void;
}

const StudentImportPreviewModal: React.FC<StudentImportPreviewModalProps> = ({ 
  participants, 
  examId,
  token, 
  onClose, 
  onRefresh 
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const validCount = participants.filter(p => p.isValid).length;
  const invalidCount = participants.length - validCount;

  const handleConfirmImport = async () => {
    if (validCount === 0) return;
    
    setIsImporting(true);
    try {
      const response = await axios.post('http://localhost:3001/api/students/import-confirm', {
        examId,
        participants: participants.filter(p => p.isValid)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setImportResult({ success: true, message: response.data.message });
      onRefresh();
      setTimeout(onClose, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setImportResult({ 
        success: false, 
        message: error.response?.data?.message || 'Có lỗi xảy ra khi import.' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Xem trước danh sách thí sinh</h2>
              <p className="text-sm text-slate-500">Kiểm tra thông tin trước khi ghi danh vào kỳ thi</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} disabled={isImporting}><X /></button>
        </div>

        <div className="modal-body scrollable">
          {importResult ? (
            <div className={`p-6 rounded-xl text-center ${importResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {importResult.success ? <CheckCircle2 className="mx-auto mb-3" size={48} /> : <AlertCircle className="mx-auto mb-3" size={48} />}
              <h3 className="text-lg font-bold mb-1">{importResult.success ? 'Thành công!' : 'Thất bại'}</h3>
              <p>{importResult.message}</p>
            </div>
          ) : (
            <>
              <div className="import-summary">
                <div className="summary-card bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex-1">
                  <div className="text-emerald-600 font-bold text-2xl">{validCount}</div>
                  <div className="text-emerald-700 text-sm font-medium">Thí sinh hợp lệ</div>
                </div>
                <div className="summary-card bg-rose-50 border border-rose-100 p-4 rounded-xl flex-1">
                  <div className="text-rose-600 font-bold text-2xl">{invalidCount}</div>
                  <div className="text-rose-700 text-sm font-medium">Thí sinh lỗi (Sẽ bị bỏ qua)</div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="question-table preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>STT</th>
                      <th>Họ và tên</th>
                      <th>Mã sinh viên</th>
                      <th>Lớp</th>
                      <th>Email</th>
                      <th>Số báo danh (SBD)</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr key={idx} className={p.isValid ? '' : 'row-invalid'}>
                        <td className="text-center font-bold text-slate-400">{p.stt}</td>
                        <td className="font-medium">{p.fullName}</td>
                        <td>{p.studentCode}</td>
                        <td>{p.className}</td>
                        <td className="text-xs text-slate-500">{p.email}</td>
                        <td className="font-mono text-blue-600">{p.examCode || '(Tự động)'}</td>
                        <td>
                          {p.isValid ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
                              <CheckCircle2 size={12} /> Hợp lệ
                            </span>
                          ) : (
                            <div className="error-messages text-rose-600 text-xs">
                              {p.errors.map((err, i) => <div key={i}>{err}</div>)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isImporting}
          >
            Hủy bỏ
          </button>
          {!importResult && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleConfirmImport}
              disabled={isImporting || validCount === 0}
            >
              {isImporting ? 'Đang xử lý...' : `Ghi danh ${validCount} thí sinh`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentImportPreviewModal;
