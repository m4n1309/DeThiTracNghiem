import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Trophy,
  Target,
  Download,
  Search,
  ArrowLeft,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart as BarChartIcon,
  Printer,
  ClipboardList
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import './ExamResults.css';
import ScoreSheetModal from '../../components/common/ScoreSheetModal';
import Pagination from '../../components/common/Pagination';

interface StudentResult {
  result_id: number;
  exam_code: string;
  full_name: string;
  total_score: number;
  passing_score: number;
  completion_status: string;
  created_at: string;
  completed_at: string;
  exam_name: string;
  attempt_id: number;
}

interface ExamStats {
  total_participants: number;
  avg_score: number | string;
  max_score: number;
  min_score: number;
  passed_count: number;
}

interface ExamSummary {
  exam_id: number;
  exam_name: string;
  subject_name: string;
  total_participants: number;
  avg_score: number;
  passed_count: number;
  start_time: string;
}

interface StudentSummary {
  student_code: string;
  full_name: string;
  exams_taken: number;
  overall_avg_score: number;
  last_exam_at: string;
}

const ExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  // States for detailed view
  const [results, setResults] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [distribution, setDistribution] = useState<{ range: string, count: number }[]>([]);

  // States for summary view
  const [activeTab, setActiveTab] = useState<'exams' | 'students'>('exams');
  const [examSummaries, setExamSummaries] = useState<ExamSummary[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state for detailed results
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Pagination state for summary views
  const [summaryPage, setSummaryPage] = useState(1);
  const [summaryTotalPages, setSummaryTotalPages] = useState(1);
  const [summaryTotalItems, setSummaryTotalItems] = useState(0);

  const itemsPerPage = 10;

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);

  const { token } = useAuth();

  const fetchData = useCallback(async (page: number) => {
    if (!token) return;

    setLoading(true);
    try {
      if (examId) {
        // Fetch detailed data for a specific exam
        const [resResults, resStats, resDist] = await Promise.all([
          axios.get(`http://localhost:3001/api/results/exam/${examId}?page=${page}&limit=${itemsPerPage}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:3001/api/results/exam/${examId}/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:3001/api/results/exam/${examId}/distribution`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setResults(resResults.data.data.map((r: StudentResult) => ({
          ...r,
          completed_at: r.created_at
        })));
        setTotalPages(resResults.data.meta.totalPages);
        setTotalItems(resResults.data.meta.totalItems);
        setStats(resStats.data);
        setDistribution(resDist.data);
      } else {
        // Fetch summaries based on active tab
        const endpoint = activeTab === 'exams' ? 'exams' : 'students';
        const res = await axios.get(`http://localhost:3001/api/results/summary/${endpoint}?page=${page}&limit=${itemsPerPage}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (activeTab === 'exams') {
          setExamSummaries(res.data.data || []);
        } else {
          setStudentSummaries(res.data.data || []);
        }

        setSummaryTotalPages(res.data.meta?.totalPages || 1);
        setSummaryTotalItems(res.data.meta?.totalItems || 0);
      }
    } catch (err) {
      console.error('Error in main fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [examId, token, activeTab]);

  useEffect(() => {
    if (examId) {
      fetchData(currentPage);
    } else {
      fetchData(summaryPage);
    }
  }, [fetchData, currentPage, summaryPage, examId]);

  // Reset summary page when tab changes
  useEffect(() => {
    if (!examId) {
      setSummaryPage(1);
    }
  }, [activeTab, examId]);

  const handlePrintClick = (result: StudentResult) => {
    setSelectedResult(result);
    setIsPrintModalOpen(true);
  };

  const exportToExcel = () => {
    if (results.length === 0) return;

    const excelData = results.map(r => ({
      'Số báo danh': r.exam_code,
      'Họ và tên': r.full_name,
      'Điểm số': Number(r.total_score).toFixed(2),
      'Trạng thái': r.total_score >= r.passing_score ? 'ĐẠT' : 'TRƯỢT',
      'Ngày nộp bài': new Date(r.created_at).toLocaleString('vi-VN')
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả');

    // Auto-fit columns
    const max_width = excelData.reduce((w, r) => Math.max(w, r['Họ và tên'].length), 10);
    worksheet['!cols'] = [{ wch: 15 }, { wch: max_width + 5 }, { wch: 10 }, { wch: 15 }, { wch: 25 }];

    XLSX.writeFile(workbook, `Ket_qua_ky_thi_${examId}.xlsx`);
  };

  const filteredResults = results.filter(r => {
    const matchesSearch = r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.exam_code.toLowerCase().includes(searchTerm.toLowerCase());
    const isPassed = r.total_score >= r.passing_score;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'passed' && isPassed) ||
      (statusFilter === 'failed' && !isPassed);
    return matchesSearch && matchesStatus;
  });

  const renderExamsSummary = () => (
    <div className="summary-section animate-in">
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Tên Kỳ thi</th>
              <th>Môn học</th>
              <th className="text-center">Thí sinh</th>
              <th className="text-center">Điểm TB</th>
              <th className="text-center">Tỷ lệ Đạt</th>
              <th>Ngày bắt đầu</th>
            </tr>
          </thead>
          <tbody>
            {(examSummaries || []).map(ex => {
              const passRate = ex.total_participants > 0
                ? (ex.passed_count / ex.total_participants * 100).toFixed(1)
                : '0';
              return (
                <tr key={ex.exam_id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`${ex.exam_id}`)}>
                  <td className="font-bold text-[var(--primary)]">{ex.exam_name}</td>
                  <td>{ex.subject_name}</td>
                  <td className="text-center">{ex.total_participants}</td>
                  <td className="text-center font-medium">{Number(ex.avg_score || 0).toFixed(2)}</td>
                  <td className="text-center">
                    <span className={`status-badge ${Number(passRate) >= 50 ? 'passed' : 'failed'}`}>
                      {passRate}%
                    </span>
                  </td>
                  <td className="time-cell">
                    <Clock size={12} />
                    {new Date(ex.start_time).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={summaryPage}
        totalPages={summaryTotalPages}
        onPageChange={(page) => setSummaryPage(page)}
        totalItems={summaryTotalItems}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );

  const renderStudentsSummary = () => (
    <div className="summary-section animate-in">
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Mã sinh viên</th>
              <th className="text-center">Số bài thi</th>
              <th className="text-center">Điểm TB tích lũy</th>
              <th>Hoạt động cuối</th>
            </tr>
          </thead>
          <tbody>
            {(studentSummaries || []).map((s, idx) => (
              <tr key={s.student_code || idx}>
                <td className="font-bold">{s.full_name}</td>
                <td><span className="sbd-badge">{s.student_code || 'N/A'}</span></td>
                <td className="text-center">{s.exams_taken}</td>
                <td className="text-center font-bold text-[var(--primary)]">
                  {Number(s.overall_avg_score || 0).toFixed(2)}
                </td>
                <td className="time-cell">
                  <Clock size={12} />
                  {new Date(s.last_exam_at).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={summaryPage}
        totalPages={summaryTotalPages}
        onPageChange={(page) => setSummaryPage(page)}
        totalItems={summaryTotalItems}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="title-section">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Quay lại
          </button>
          <h1>{examId ? 'Kết quả Chi tiết' : 'Thống kê Kết quả'}</h1>
          <p>{examId ? 'Báo cáo điểm số và thống kê học viên' : 'Tổng quan kết quả theo kỳ thi và người thi'}</p>
        </div>
        <button className="btn-export" onClick={exportToExcel} disabled={results.length === 0 || !examId}>
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      {!examId ? (
        <div className="results-dashboard">
          <div className="results-tabs">
            <button
              className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => setActiveTab('exams')}
            >
              <ClipboardList size={18} />
              Theo Cuộc thi
            </button>
            <button
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <Users size={18} />
              Theo Người thi
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Đang tải dữ liệu thống kê...</div>
          ) : (
            activeTab === 'exams' ? renderExamsSummary() : renderStudentsSummary()
          )}
        </div>
      ) : (
        <>
          {stats && (
            <div className="stats-overview">
              <div className="s-card info">
                <Users size={24} className="icon" />
                <div className="s-info">
                  <span className="s-label">Thí sinh</span>
                  <span className="s-value">{stats.total_participants}</span>
                </div>
              </div>
              <div className="s-card success">
                <CheckCircle2 size={24} className="icon" />
                <div className="s-info">
                  <span className="s-label">Tỷ lệ Đạt</span>
                  <span className="s-value">{stats.total_participants > 0 ? ((stats.passed_count / stats.total_participants) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
              <div className="s-card warning">
                <Target size={24} className="icon" />
                <div className="s-info">
                  <span className="s-label">Điểm Trung Bình</span>
                  <span className="s-value">{parseFloat(stats.avg_score as string || '0').toFixed(2)}</span>
                </div>
              </div>
              <div className="s-card info-alt">
                <Trophy size={24} className="icon" />
                <div className="s-info">
                  <span className="s-label">Điểm Cao Nhất</span>
                  <span className="s-value">{stats.max_score || 0}</span>
                </div>
              </div>
            </div>
          )}

          {distribution.length > 0 && (
            <div className="distribution-chart-section animate-in">
              <div className="chart-header">
                <BarChartIcon size={20} className="text-indigo-500" />
                <h2>Phân phối điểm số (Phổ điểm)</h2>
              </div>
              <div className="chart-container" style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={distribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distribution.map((_, index) => {
                        const colors = ['#f43f5e', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="results-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc SBD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <Filter size={18} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="passed">Đã Đạt</option>
                <option value="failed">Chưa Đạt</option>
              </select>
            </div>
          </div>

          <div className="results-table-wrapper">
            {loading ? (
              <div className="loading-state">Đang tải kết quả...</div>
            ) : filteredResults.length === 0 ? (
              <div className="empty-state">Không tìm thấy kết quả nào.</div>
            ) : (
              <>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>SBD</th>
                      <th>Họ & Tên</th>
                      <th>Điểm số</th>
                      <th>Trạng thái</th>
                      <th>Thời gian nộp</th>
                      <th className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((r, index) => {
                      const isPassed = r.total_score >= r.passing_score;
                      return (
                        <tr key={r.result_id}>
                          <td>{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                          <td><span className="sbd-badge">{r.exam_code}</span></td>
                          <td className="font-bold">{r.full_name}</td>
                          <td className="score-cell">{Number(r.total_score).toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${isPassed ? 'passed' : 'failed'}`}>
                              {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {isPassed ? 'ĐẠT' : 'TRƯỢT'}
                            </span>
                          </td>
                          <td className="time-cell">
                            <Clock size={12} />
                            {new Date(r.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn-print-row"
                              title="Xem chi tiết bài làm"
                              onClick={() => navigate(`/exam-review/${r.attempt_id}`)}
                            >
                              <ClipboardList size={16} />
                            </button>
                            <button
                              className="btn-print-row ms-1"
                              title="In phiếu điểm"
                              onClick={() => handlePrintClick(r)}
                            >
                              <Printer size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </>
            )}
          </div>
        </>
      )}

      <ScoreSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        result={selectedResult}
      />
    </div>
  );
};

export default ExamResults;
