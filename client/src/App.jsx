import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Course from './pages/Course.jsx';
import Exam from './pages/Exam.jsx';
import Result from './pages/Result.jsx';
import Analytics from './pages/Analytics.jsx';
import PastPapers from './pages/PastPapers.jsx';
import Literacy from './pages/Literacy.jsx';
import LiteracyLesson from './pages/LiteracyLesson.jsx';
import Credentials from './pages/Credentials.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import VerifyCredential from './pages/VerifyCredential.jsx';

function RequireRole({ allow, children }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!allow.includes(role)) {
    if (role === 'student') return <Navigate to="/dashboard" replace />;
    if (role === 'lecturer' || role === 'admin') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, isStaff } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isStaff ? '/staff/dashboard' : '/dashboard'} replace />;
  }
  return children;
}

function NotFound() {
  return (
    <div className="notfound">
      <span className="eyebrow">404</span>
      <h1>This route is not part of the examination plan.</h1>
      <p>Return to your dashboard or sign in with a verified registration number.</p>
      <Link className="btn btn-primary" to="/">
        Back to ExamLab
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicOnly>
                    <Landing />
                  </PublicOnly>
                }
              />
              <Route path="/verify" element={<VerifyCredential />} />
              <Route path="/verify/:code" element={<VerifyCredential />} />
              <Route
                path="/dashboard"
                element={
                  <RequireRole allow={['student']}>
                    <Dashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/courses/:courseId"
                element={
                  <RequireRole allow={['student']}>
                    <Course />
                  </RequireRole>
                }
              />
              <Route
                path="/exam/:sessionId"
                element={
                  <RequireRole allow={['student']}>
                    <Exam />
                  </RequireRole>
                }
              />
              <Route
                path="/result/:sessionId"
                element={
                  <RequireRole allow={['student']}>
                    <Result />
                  </RequireRole>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireRole allow={['student']}>
                    <Analytics />
                  </RequireRole>
                }
              />
              <Route
                path="/past-papers"
                element={
                  <RequireRole allow={['student']}>
                    <PastPapers />
                  </RequireRole>
                }
              />
              <Route
                path="/literacy"
                element={
                  <RequireRole allow={['student']}>
                    <Literacy />
                  </RequireRole>
                }
              />
              <Route
                path="/literacy/:slug"
                element={
                  <RequireRole allow={['student']}>
                    <LiteracyLesson />
                  </RequireRole>
                }
              />
              <Route
                path="/credentials"
                element={
                  <RequireRole allow={['student']}>
                    <Credentials />
                  </RequireRole>
                }
              />
              <Route
                path="/staff/dashboard"
                element={
                  <RequireRole allow={['lecturer', 'admin']}>
                    <StaffDashboard />
                  </RequireRole>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
