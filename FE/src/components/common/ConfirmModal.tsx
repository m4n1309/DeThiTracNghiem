import React from 'react';
import { AlertCircle, Info, X } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = 'info',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-pop-in">
        <button className="modal-close-btn" onClick={onCancel}>
          <X size={20} />
        </button>
        
        <div className="modal-body">
          <div className={`modal-icon-wrapper ${type}`}>
            {type === 'warning' ? <AlertCircle size={32} /> : <Info size={32} />}
          </div>
          
          <div className="modal-text">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn-confirm ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
