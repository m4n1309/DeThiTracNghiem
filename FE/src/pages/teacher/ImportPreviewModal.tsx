import API_BASE_URL from '../../config/api';
import React from 'react';
import { X, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import axios from 'axios';

export interface PreviewQuestion {
  stt: number;
  questionText: string;
  options: string[];
  correctOption: string[];
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
      await axios.post(`${API_BASE_URL}/questions/import-confirm`, 
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
      <div className="qb-import-modal-content">
        <div className="qb-import-modal-header">
          <h2 className="flex items-center gap-2">
            <Download size={24} className="text-blue-500" />
            Xem trước dữ liệu Import
          </h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="qb-import-modal-body">
          <div className="import-summary">
            <div className="summary-card p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="text-emerald-500 mb-2" size={32} />
              <div className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Hợp lệ</div>
              <div className="text-2xl font-black text-emerald-700">{validCount}</div>
              <div className="text-xs text-emerald-600 font-medium opacity-80">câu hỏi</div>
            </div>
            <div className="summary-card p-4 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertCircle className="text-rose-500 mb-2" size={32} />
              <div className="text-sm text-rose-600 font-bold uppercase tracking-wider">Lỗi</div>
              <div className="text-2xl font-black text-rose-700">{invalidCount}</div>
              <div className="text-xs text-rose-600 font-medium opacity-80">câu hỏi</div>
            </div>
          </div>

        </div>

        <div className="qb-import-modal-footer">
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
