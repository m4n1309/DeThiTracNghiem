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
      <div className="modal-content">
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
