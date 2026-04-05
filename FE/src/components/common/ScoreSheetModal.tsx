import React from 'react';
import { X, Printer, CheckCircle, XCircle } from 'lucide-react';
import './ScoreSheetModal.css';

interface StudentResult {
  result_id: number;
  exam_code: string;
  full_name: string;
  total_score: number;
  passing_score: number;
  exam_name: string;
  completed_at: string;
}

interface ScoreSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StudentResult | null;
}

const ScoreSheetModal: React.FC<ScoreSheetModalProps> = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPassed = result.total_score >= result.passing_score;

  return (
    <div className="scoresheet-overlay no-print">
      <div className="scoresheet-container animate-pop-in">
        <div className="scoresheet-modal-header no-print">
          <h2>Xem trước Phiếu điểm</h2>
          <div className="header-actions">
            <button className="btn-print-main" onClick={handlePrint}>
              <Printer size={18} /> In phiếu điểm
            </button>
            <button className="btn-close-modal" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="scoresheet-content printable-area" id="printable-sheet">
          <div className="sheet-header">
            <div className="school-info">
              <h3>HỆ THỐNG QUẢN LÝ THI THỬ</h3>
              <p>Mã bưu điện: 100000 | Email: support@examinfo.com</p>
            </div>
            <div className="sheet-title">
              <h1>PHIẾU ĐIỂM KẾT QUẢ</h1>
              <p>Kỳ thi: {result.exam_name}</p>
            </div>
          </div>

          <div className="student-info-section">
            <div className="info-row">
              <span className="label">Họ và tên thí sinh:</span>
              <span className="value">{result.full_name}</span>
            </div>
            <div className="info-row">
              <span className="label">Số báo danh (SBD):</span>
              <span className="value">{result.exam_code}</span>
            </div>
            <div className="info-row">
              <span className="label">Ngày nộp bài:</span>
              <span className="value">{new Date(result.completed_at).toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="result-main-section">
            <div className="score-summary">
              <div className="score-box">
                <span className="s-label">Điểm số đạt được</span>
                <span className="s-value">{Number(result.total_score).toFixed(2)}</span>
              </div>
              <div className={`status-box ${isPassed ? 'passed' : 'failed'}`}>
                {isPassed ? <CheckCircle size={24} /> : <XCircle size={24} />}
                <span className="status-text">{isPassed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}</span>
              </div>
            </div>
            
            <div className="grading-notice">
              <p>* Điểm chuẩn để vượt qua kỳ thi này là: <strong>{result.passing_score} điểm</strong>.</p>
              <p>Kết quả này đã được hệ thống tự động ghi nhận tại thời điểm kết thúc bài làm.</p>
            </div>
          </div>

          <div className="sheet-footer">
            <div className="signature-area">
              <p>Ngày ... tháng ... năm 202...</p>
              <p className="signature-label">Người phê duyệt</p>
              <div className="signature-space"></div>
              <p className="approver-name">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreSheetModal;
