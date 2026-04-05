import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, Image as ImageIcon, Save } from 'lucide-react';
import './QuestionModal.css';

interface QuestionModalProps {
  question: any;
  subjectId: number;
  onClose: () => void;
  onRefresh: () => void;
  token: string;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, subjectId, onClose, onRefresh, token }) => {
  const [formData, setFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A' as 'A' | 'B' | 'C' | 'D',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.question_text,
        optionA: question.option_a,
        optionB: question.option_b,
        optionC: question.option_c,
        optionD: question.option_d,
        correctOption: question.correct_option,
        imageUrl: question.image_url || ''
      });
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = question 
        ? `http://localhost:3001/api/questions/${question.question_id}` 
        : 'http://localhost:3001/api/questions';
      
      const method = question ? 'put' : 'post';

      await axios[method](url, { ...formData, subjectId }, {
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

  const handleOptionClick = (opt: 'A' | 'B' | 'C' | 'D') => {
    setFormData({ ...formData, correctOption: opt });
  };

  return (
    <div className="qmodal-overlay" onClick={onClose}>
      <div className="qmodal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="qmodal-header">
          <h2>{question ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}</h2>
          <button onClick={onClose} className="qmodal-close" title="Đóng">
            <X size={24} />
          </button>
        </header>

        {/* Body */}
        <div className="qmodal-body">
          {error && <div className="qmodal-error">{error}</div>}

          <form id="question-form" onSubmit={handleSubmit} className="qmodal-form">
            {/* Section 1: Question Content */}
            <div className="qmodal-section">
              <span className="qmodal-section-title">Nội dung câu hỏi</span>
              <div className="qmodal-field">
                <textarea 
                  required
                  className="qmodal-textarea" 
                  value={formData.questionText}
                  onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                  placeholder="Nhập nội dung câu hỏi trắc nghiệm tại đây..."
                />
              </div>
            </div>

            {/* Section 2: Options */}
            <div className="qmodal-section">
              <span className="qmodal-section-title">Các lựa chọn trả lời (Nhấn để chọn đáp án đúng)</span>
              <div className="qmodal-options-grid">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div 
                    key={opt} 
                    className={`qmodal-option-card ${formData.correctOption === opt ? 'active' : ''}`}
                    onClick={() => handleOptionClick(opt)}
                  >
                    <div className="qmodal-option-header">
                      <div className="qmodal-option-letter">{opt}</div>
                      {formData.correctOption === opt && (
                        <div className="qmodal-option-status">
                          <CheckCircle2 size={14} /> Correct
                        </div>
                      )}
                    </div>
                    <input 
                      type="text" 
                      required
                      className="qmodal-input"
                      value={formData[`option${opt}` as keyof typeof formData] as string}
                      onChange={(e) => setFormData({...formData, [`option${opt}`]: e.target.value})}
                      placeholder={`Mô tả lựa chọn ${opt}...`}
                      onClick={(e) => e.stopPropagation()} // Prevent card click when typing
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Extra Info */}
            <div className="qmodal-section">
              <span className="qmodal-section-title">Thông tin bổ sung</span>
              <div className="qmodal-field">
                <label className="qmodal-label flex items-center gap-2">
                  <ImageIcon size={16} /> Ảnh minh họa (URL)
                </label>
                <input 
                  type="text" 
                  className="qmodal-input" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="qmodal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            className="qmodal-btn qmodal-btn-cancel"
          >
            Hủy bỏ
          </button>
          <button 
            form="question-form"
            type="submit" 
            disabled={loading}
            className="qmodal-btn qmodal-btn-save flex items-center justify-center gap-2"
          >
            {loading ? (
              'Đang xử lý...'
            ) : (
              <>
                <Save size={18} />
                {question ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default QuestionModal;
