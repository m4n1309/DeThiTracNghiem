import API_BASE_URL from '../../config/api';
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
      const response = await axios.post(`${API_BASE_URL}/students/import-confirm`, {
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
    <div className="student-modal-overlay">
      <div className="student-modal-content" style={{ maxWidth: '520px' }}>
        <div className="student-modal-header">
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

        <div className="student-modal-body">
          {importResult ? (
            <div className={`p-6 rounded-xl text-center ${importResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {importResult.success ? <CheckCircle2 className="mx-auto mb-3" size={48} /> : <AlertCircle className="mx-auto mb-3" size={48} />}
              <h3 className="text-lg font-bold mb-1">{importResult.success ? 'Thành công!' : 'Thất bại'}</h3>
              <p>{importResult.message}</p>
            </div>
          ) : (
            <>
              <div className="import-summary">
                <div className="summary-card bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="text-emerald-500 mb-2" size={32} />
                  <div className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Hợp lệ</div>
                  <div className="text-2xl font-black text-emerald-700">{validCount}</div>
                  <div className="text-xs text-emerald-600 font-medium opacity-80">thí sinh</div>
                </div>
                <div className="summary-card bg-rose-50 border border-rose-100">
                  <AlertCircle className="text-rose-500 mb-2" size={32} />
                  <div className="text-sm text-rose-600 font-bold uppercase tracking-wider">Lỗi</div>
                  <div className="text-2xl font-black text-rose-700">{invalidCount}</div>
                  <div className="text-xs text-rose-600 font-medium opacity-80">thí sinh</div>
                </div>
              </div>

            </>
          )}
        </div>

        <div className="student-modal-footer">
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
