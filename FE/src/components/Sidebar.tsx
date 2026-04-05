import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  Users, 
  BookOpen, 
  LogOut,
  ChevronRight,
  GraduationCap,
  BarChart3,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  user: {
    fullName: string;
    role: string;
    studentId?: string;
  };
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const adminMenu = [
    { name: 'Trang chủ', path: '/admin', icon: LayoutDashboard },
    { name: 'Môn học', path: '/admin/subjects', icon: BookOpen },
    { name: 'Câu hỏi', path: '/admin/questions', icon: HelpCircle },
    { name: 'Đề thi', path: '/admin/exams', icon: FileText },
    { name: 'Học viên', path: '/admin/students', icon: GraduationCap },
    { name: 'Người dùng', path: '/admin/users', icon: Users },
    { name: 'Kết quả', path: '/admin/results', icon: ClipboardList },
    { name: 'Phân tích', path: '/admin/analytics', icon: BarChart3 },
  ];

  const teacherMenu = [
    { name: 'Tổng quan', path: '/teacher', icon: LayoutDashboard },
    { name: 'Ngân hàng câu hỏi', path: '/teacher/questions', icon: HelpCircle },
    { name: 'Quản lý đề thi', path: '/teacher/exams', icon: FileText },
    { name: 'Quản lý học viên', path: '/teacher/students', icon: GraduationCap },
    { name: 'Kết quả thi', path: '/teacher/results', icon: ClipboardList },
    { name: 'Thống kê kết quả', path: '/teacher/analytics', icon: BarChart3 },
  ];

  const menuItems = user.role === 'admin' ? adminMenu : teacherMenu;

  return (
    <div className="sidebar-container">
      <div className="sidebar-logo">
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <GraduationCap size={24} />
        </div>
        <div className="sidebar-logo-text">
          <h3 style={{ fontSize: '1.25rem', marginBottom: 0 }}>QuizFlow</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Hệ thống quản lý thi</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="sidebar-item-icon" />
              <span className="sidebar-item-text">{item.name}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          background: user.role === 'admin' ? '#f5f3ff' : '#ecfdf5',
          color: user.role === 'admin' ? '#7c3aed' : '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.875rem'
        }}>
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user.fullName}</div>
          <div className="sidebar-user-role">
            {user.role === 'admin' ? 'Quản trị viên' : 'Giảng viên'}
          </div>
        </div>
        <div 
          className="sidebar-logout" 
          onClick={onLogout}
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
