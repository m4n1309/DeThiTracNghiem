import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import './MultiDimensionAnalytics.css';

interface SubjectStat {
  subject_name: string;
  total_exams_taken: number;
  avg_score: string | number;
}

const MultiDimensionAnalytics: React.FC = () => {
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [passFailData, setPassFailData] = useState<any>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subjectsRes, passFailRes, trendsRes] = await Promise.all([
          axios.get('http://localhost:3001/api/results/subjects/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3001/api/results/summary/pass-fail', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3001/api/results/summary/trends', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setSubjectStats(subjectsRes.data);
        setPassFailData(passFailRes.data);
        setMonthlyTrends(trendsRes.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const pieData = passFailData ? [
    { name: 'Đạt', value: Number(passFailData.passed), color: '#10b981' },
    { name: 'Không đạt', value: Number(passFailData.failed), color: '#ef4444' }
  ] : [];

  const totalResults = passFailData ? Number(passFailData.passed) + Number(passFailData.failed) : 0;
  const passRate = totalResults > 0 ? Math.round((Number(passFailData.passed) / totalResults) * 100) : 0;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="title-group">
          <h1>Báo cáo thống kê</h1>
          <p>Phân tích dữ liệu kết quả thi và hiệu suất đào tạo</p>
        </div>
      </div>

      {loading ? (
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu phân tích...</p>
        </div>
      ) : (
        <div className="analytics-dashboard-grid">
          {/* Top Left: Monthly Trends */}
          <div className="analytics-card trend-card">
            <div className="card-header">
              <TrendingUp size={20} className="text-blue-500" />
              <h3>Số lượng thí sinh tham gia theo tháng</h3>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month_year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    name="Số lượt thi"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Right: Pass/Fail Donut */}
          <div className="analytics-card pass-rate-card">
            <div className="card-header">
              <PieChartIcon size={20} className="text-emerald-500" />
              <h3>Tỷ lệ Đạt / Không đạt</h3>
            </div>
            <div className="chart-wrapper donut-container">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span className="percentage">{passRate}%</span>
                <span className="label">ĐÃ ĐẠT</span>
              </div>
              <div className="pie-legend custom">
                  {pieData.map(item => (
                    <div key={item.name} className="legend-item">
                      <span className="dot" style={{ backgroundColor: item.color }}></span>
                      <span className="name">{item.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Bottom: Subject Performance Horizontal Bar */}
          <div className="analytics-card subject-card full-width">
            <div className="card-header">
              <BarChart3 size={20} className="text-indigo-500" />
              <h3>Thống kê điểm số theo môn học</h3>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={Math.max(300, subjectStats.length * 60)}>
                <BarChart data={subjectStats} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 10]} axisLine={false} tickLine={false} />
                  <YAxis dataKey="subject_name" type="category" axisLine={false} tickLine={false} width={150} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="avg_score" radius={[0, 8, 8, 0]} name="Điểm trung bình" barSize={30}>
                    {subjectStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiDimensionAnalytics;
