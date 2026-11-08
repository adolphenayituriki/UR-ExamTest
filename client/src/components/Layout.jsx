import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';
import Logo from './Logo.jsx';

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
            <label className="avatar avatar-sm avatar-cycle" style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const img = document.createElement('img');
                  img.src = ev.target.result;
                  img.style.width = 'calc(100% - 6px)';
                  img.style.height = 'calc(100% - 6px)';
                  img.style.objectFit = 'cover';
                  img.style.borderRadius = '50%';
                  img.style.position = 'relative';
                  img.style.zIndex = '1';
                  const label = e.target.parentElement;
                  label.querySelectorAll('img,span').forEach(x=>x.remove());
                  label.appendChild(img);
                };
                reader.readAsDataURL(file);
              }} />
              <span>NA</span>
            </label>
            <div className="topbar-user-text">
              <strong>NAYITURIKI Adolphe</strong>
              <span>
                223452022 · Year 4
              </span>
            </div>
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
