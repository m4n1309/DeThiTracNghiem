import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const SubjectManagement = React.lazy(() => import('./pages/admin/SubjectManagement'));
import QuestionBank from './pages/teacher/QuestionBank';
import StudentManagement from './pages/teacher/StudentManagement';
import ExamManagement from './pages/teacher/ExamManagement';
import ExamResults from './pages/teacher/ExamResults';
import StudentExamLanding from './pages/student/StudentExamLanding';
import TakingExam from './pages/student/TakingExam';
import ExamReview from './pages/student/ExamReview';
import ExamResult from './pages/student/ExamResult';
import ExamSelection from './pages/student/ExamSelection';
import Dashboard from './pages/teacher/Dashboard';
import Sidebar from './components/Sidebar';
const MultiDimensionAnalytics = React.lazy(() => import('./pages/teacher/MultiDimensionAnalytics'));

// Placeholder Components for Dashboards
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar user={user} onLogout={logout} />
      
      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="subjects" element={<SubjectManagement />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="exams" element={<ExamManagement />} />
          <Route path="results" element={<ExamResults />} />
          <Route path="results/:examId" element={<ExamResults />} />
          <Route path="analytics" element={
            <React.Suspense fallback={<div>Đang tải phân tích...</div>}>
              <MultiDimensionAnalytics />
            </React.Suspense>
          } />
        </Routes>
      </main>
    </div>
  );
};

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar user={user} onLogout={logout} />

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="exams" element={<ExamManagement />} />
          <Route path="results" element={<ExamResults />} />
          <Route path="results/:examId" element={<ExamResults />} />
          <Route path="analytics" element={
            <React.Suspense fallback={<div>Đang tải phân tích...</div>}>
              <MultiDimensionAnalytics />
            </React.Suspense>
          } />
        </Routes>
      </main>
    </div>
  );
};


function App() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/student-login" element={<StudentLogin />} />

      {/* Protected Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />


      <Route
        path="/student/select-exam"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ExamSelection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exam-landing"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExamLanding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/taking-exam/:attemptId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <TakingExam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ExamResult />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exam-review/:attemptId"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <ExamReview />
          </ProtectedRoute>
        }
      />


      <Route
        path="/student-dashboard"
        element={<Navigate to="/student/exam-landing" replace />}
      />

      {/* Root Redirection Logic */}
      <Route path="/" element={
        !user ? <Navigate to="/student-login" /> :
          user.role === 'admin' ? <Navigate to="/admin" /> :
            user.role === 'teacher' ? <Navigate to="/teacher" /> :
              <Navigate to="/student-dashboard" />
      } />

      {/* Logout Route */}
      <Route path="/logout" element={<LogoutRedirect logout={logout} />} />
    </Routes>
  );
}

const LogoutRedirect: React.FC<{ logout: () => void }> = ({ logout }) => {
  React.useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/login" replace />;
};

export default App;
