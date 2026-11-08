import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
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

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function NotFound() {
  return (
    <div className="notfound">
      <span className="eyebrow">404</span>
      <h1>This route is not part of the examination plan.</h1>
      <p>Return to your dashboard or sign in with a verified registration number.</p>
      <a className="btn btn-primary" href="/">
        Back to ExamLab
      </a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
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
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/courses/:courseId"
            element={
              <Protected>
                <Course />
              </Protected>
            }
          />
          <Route
            path="/exam/:sessionId"
            element={
              <Protected>
                <Exam />
              </Protected>
            }
          />
          <Route
            path="/result/:sessionId"
            element={
              <Protected>
                <Result />
              </Protected>
            }
          />
          <Route
            path="/analytics"
            element={
              <Protected>
                <Analytics />
              </Protected>
            }
          />
          <Route
            path="/past-papers"
            element={
              <Protected>
                <PastPapers />
              </Protected>
            }
          />
          <Route
            path="/literacy"
            element={
              <Protected>
                <Literacy />
              </Protected>
            }
          />
          <Route
            path="/literacy/:slug"
            element={
              <Protected>
                <LiteracyLesson />
              </Protected>
            }
          />
          <Route
            path="/credentials"
            element={
              <Protected>
                <Credentials />
              </Protected>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
