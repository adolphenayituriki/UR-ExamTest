import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';
import Logo from './Logo.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';

export default function Layout({ children, wide = false }) {
  const { student, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/dashboard" className="brand-link" aria-label="ExamLab dashboard">
            <Logo />
          </NavLink>
          <nav className="topnav">
            <NavLink to="/dashboard" className="topnav-link">
              Dashboard
            </NavLink>
            <NavLink to="/past-papers" className="topnav-link">
              Past papers
            </NavLink>
            <NavLink to="/literacy" className="topnav-link">
              Digital literacy
            </NavLink>
            <NavLink to="/credentials" className="topnav-link">
              Credential
            </NavLink>
            <NavLink to="/analytics" className="topnav-link">
              Diagnostics
            </NavLink>
          </nav>
          <div className="topbar-user">
            <div className="avatar avatar-sm" aria-hidden="true">
              <span>{initials(student?.fullName || '') || 'UR'}</span>
            </div>
            <div className="topbar-user-text">
              <strong>{student?.fullName || 'UR Student'}</strong>
              <span>
                {student?.registrationNumber || '—'} · Year {student?.yearOfStudy || '—'}
              </span>
            </div>
            <DarkModeToggle />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className={wide ? 'page page-wide' : 'page'}>{children}</main>

      <footer className="app-footer">
        <Logo size="sm" />
        <span>
          Secure UR examination environment · Server-timed · AI-assisted learning
        </span>
      </footer>
    </div>
  );
}
