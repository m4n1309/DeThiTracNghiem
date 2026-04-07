import API_BASE_URL from '../../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  FileText,
  HelpCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Dashboard.css';

interface ExamData {
  exam_id: number;
  exam_name: string;
  start_time: string;
  end_time: string;
  total_questions: number;
  duration_minutes: number;
  participant_count: number;
  is_active: boolean;
  subject_name?: string;
}

interface SubjectData {
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalExamsCount, setTotalExamsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch all exams (first page, limit 10 as per user preference)
        const examsRes = await axios.get(`${API_BASE_URL}/exams?page=1&limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Handle { data, meta } structure
        const examList = examsRes.data.data || [];
        const examMeta = examsRes.data.meta || { totalItems: examList.length };
        
        setExams(examList);
        setTotalExamsCount(examMeta.totalItems);

        // 2. Fetch subjects assigned to teacher (this returns direct array)
        const subjectsRes = await axios.get(`${API_BASE_URL}/questions/my-subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const subjects: SubjectData[] = subjectsRes.data;

        let qTotal = 0;
        for (const sub of subjects) {
          try {
            const statsRes = await axios.get(`${API_BASE_URL}/exams/stats/${sub.subject_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            qTotal += statsRes.data.total || 0;
          } catch { /* skip */ }
        }
        setTotalQuestions(qTotal);

        // 3. Calculate total students (Approximate from the first page of exams or 
        // we should have a dedicated total stats endpoint. For now, use participant_count if available)
        let sTotal = 0;
        for (const exam of examList) {
          sTotal += exam.participant_count || 0;
        }
        setTotalStudents(sTotal);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const totalExams = totalExamsCount;
  const activeExams = exams.filter(e => e.is_active).length;
  const avgDuration = exams.length > 0
    ? Math.round(exams.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / exams.length)
    : 0;

  // Upcoming exams: filter future exams, sort by start_time
  const upcomingExams = exams
    .filter(e => e.start_time && new Date(e.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  // If no upcoming exams, just show first 5
  const displayExams = upcomingExams.length > 0 ? upcomingExams : exams.slice(0, 5);

  // Chart mock data (real traffic logging is not available in DB)
  const chartData = [
    { name: 'Thứ 2', luotThi: 12, svMoi: 5 },
    { name: 'Thứ 3', luotThi: 19, svMoi: 8 },
    { name: 'Thứ 4', luotThi: 15, svMoi: 6 },
    { name: 'Thứ 5', luotThi: 25, svMoi: 12 },
    { name: 'Thứ 6', luotThi: 30, svMoi: 15 },
    { name: 'Thứ 7', luotThi: 28, svMoi: 10 },
    { name: 'CN', luotThi: 8, svMoi: 3 },
  ];

  const examColors = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Đang tải dữ liệu tổng quan...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p className="dashboard-greeting">
            Chào mừng quay trở lại, {user?.role === 'admin' ? 'Quản trị viên' : 'Giảng viên'} <strong>{user?.fullName || 'Người dùng'}</strong>
          </p>
        </div>
      </header>

      {/* Stats Grid - 4 cards */}
      <div className="stats-grid">
        {/* Card 1: Tổng sinh viên */}
        <div className="stats-card">
          <div className="stats-card-top">
            <div className="stats-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Users size={24} />
            </div>
            <div className="stats-trend positive">
              <TrendingUp size={12} /> 12.5%
            </div>
          </div>
          <div className="stats-card-body">
            <span className="stats-label">Tổng sinh viên</span>
            <span className="stats-value">{totalStudents.toLocaleString()}</span>
          </div>
          <span className="stats-sub">Tổng số thí sinh đã đăng ký</span>
        </div>

        {/* Card 2: Tổng đề thi */}
        <div className="stats-card">
          <div className="stats-card-top">
            <div className="stats-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <FileText size={24} />
            </div>
            <div className="stats-trend positive">
              <TrendingUp size={12} /> 5.2%
            </div>
          </div>
          <div className="stats-card-body">
            <span className="stats-label">Tổng đề thi</span>
            <span className="stats-value">{totalExams}</span>
          </div>
          <span className="stats-sub">Đang hoạt động: {activeExams}</span>
        </div>

        {/* Card 3: Ngân hàng câu hỏi */}
        <div className="stats-card">
          <div className="stats-card-top">
            <div className="stats-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <HelpCircle size={24} />
            </div>
            <div className="stats-trend positive">
              <TrendingUp size={12} /> 8.1%
            </div>
          </div>
          <div className="stats-card-body">
            <span className="stats-label">Ngân hàng câu hỏi</span>
            <span className="stats-value">{totalQuestions.toLocaleString()}</span>
          </div>
          <span className="stats-sub">Tổng câu hỏi trong hệ thống</span>
        </div>

        {/* Card 4: Thời gian trung bình */}
        <div className="stats-card">
          <div className="stats-card-top">
            <div className="stats-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <Clock size={24} />
            </div>
            <div className="stats-trend negative">
              <TrendingDown size={12} /> 2.4%
            </div>
          </div>
          <div className="stats-card-body">
            <span className="stats-label">Thời gian trung bình</span>
            <span className="stats-value">{avgDuration} <small>phút</small></span>
          </div>
          <span className="stats-sub">Trung bình thời gian thi</span>
        </div>
      </div>

      {/* Body: Chart + Upcoming Exams */}
      <div className="dashboard-body">
        {/* Chart Section */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Lưu lượng tham gia thi</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLuotThi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSvMoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px', paddingBottom: '16px' }}
                />
                <Area
                  type="monotone"
                  dataKey="luotThi"
                  name="Số lượt thi"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#colorLuotThi)"
                  dot={false}
                  activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="svMoi"
                  name="Số sinh viên mới"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  fill="url(#colorSvMoi)"
                  dot={false}
                  activeDot={{ r: 5, stroke: '#a78bfa', strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="upcoming-section">
          <div className="upcoming-header">
            <h2>Kỳ thi sắp tới</h2>
            <span className="upcoming-badge">Tất cả</span>
          </div>
          <div className="upcoming-list">
            {displayExams.length > 0 ? displayExams.map((exam, idx) => (
              <div key={exam.exam_id} className="upcoming-item" style={{ borderLeftColor: examColors[idx % examColors.length] }}>
                <h3 className="upcoming-name">{exam.exam_name}</h3>
                <div className="upcoming-meta">
                  <div className="upcoming-meta-item">
                    <Calendar size={14} />
                    <span>
                      {exam.start_time
                        ? new Date(exam.start_time).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                        : 'Chưa xác định'}
                    </span>
                  </div>
                  <div className="upcoming-meta-item">
                    <Users size={14} />
                    <span>{exam.participant_count || 0} HV</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="upcoming-empty">
                <p>Không có kỳ thi nào sắp diễn ra.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
