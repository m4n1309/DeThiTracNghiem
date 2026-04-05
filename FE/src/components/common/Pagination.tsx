import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * (itemsPerPage || 10) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0);

  return (
    <div className="pagination-container">
      {totalItems !== undefined && (
        <div className="pagination-info">
          Hiển thị <strong>{startItem}-{endItem}</strong> trong tổng số <strong>{totalItems}</strong> mục
        </div>
      )}
      
      <div className="pagination-controls">
        <button 
          className="pagination-btn" 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
          title="Trang đầu"
        >
          <ChevronsLeft size={18} />
        </button>
        
        <button 
          className="pagination-btn" 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          title="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="pagination-pages">
          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>

        <button 
          className="pagination-btn" 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          title="Trang tiếp"
        >
          <ChevronRight size={18} />
        </button>
        
        <button 
          className="pagination-btn" 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages}
          title="Trang cuối"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
