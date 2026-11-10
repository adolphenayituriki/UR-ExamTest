import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FaClock,
  FaCheckDouble,
  FaBook,
  FaGraduationCap,
  FaUsers,
  FaLightbulb,
  FaUserTie,
  FaUserGraduate,
} from 'react-icons/fa6';

const DEMO_ACCOUNTS = [
  {
    reg: '223452022',
    password: 'DemoPass1',
    name: 'NAYITURIKI Adolphe',
    detail: 'Software Engineering · Year 4',
    note: 'Full history and results',
  },
  {
    reg: '233462023',
    password: 'DemoPass2',
    name: 'MUKAMANA Alice',
    detail: 'Software Engineering · Year 3',
    note: 'Year 3 dashboard',
  },
  {
    reg: '243472024',
    password: 'DemoPass3',
    name: 'HABIMANA Eric',
    detail: 'Software Engineering · Year 2',
    note: 'Practice and mocks',
  },
  {
    reg: '990012020',
    password: 'DemoPass6',
    name: 'KAMIKAZI Claudine',
    detail: 'Inactive enrollment',
    note: 'Shows an inactive record',
  },
];

const STAFF_DEMO_ACCOUNTS = [
  {
    reg: 'STAFF001',
    password: 'StaffPass1',
    name: 'Dr. UWIZEYIMANA Jean',
    detail: 'Lecturer · Computer Science',
    note: 'Manage courses & assessments',
  },
  {
    reg: 'STAFF002',
    password: 'StaffPass2',
    name: 'Prof. MUKESHIMANA Grace',
    detail: 'Senior Lecturer · Software Engineering',
    note: 'Review student analytics',
  },
];

const STEPS = [
  {
    title: 'Choose a course',
    text: 'See the modules for your year.',
    icon: FaGraduationCap,
  },
  {
    title: 'Practise or take a mock',
    text: 'Timed questions with instant marking.',
    icon: FaClock,
  },
  {
    title: 'Fix weak topics',
    text: 'Review feedback and focus your revision.',
    icon: FaBook,
  },
];

const TRUST = [
  { label: 'Timed practice', icon: FaClock },
  { label: 'Instant marks', icon: FaCheckDouble },
  { label: 'Revision focus', icon: FaBook },
];

const SUPPORT = [
  {
    title: 'Guided hints',
    text: 'Get a nudge without the answer.',
    icon: FaLightbulb,
  },
  {
    title: 'Weak spot detection',
    text: 'See which topics need more work.',
    icon: FaUsers,
  },
  {
    title: 'Fresh questions',
    text: 'New numbers each attempt, so you learn the method.',
    icon: FaCheckDouble,
  },
];

function isNineDigits(value) {
  return /^\d{9}$/.test(String(value || '').trim());
}

function isStaffId(value) {
  return /^STAFF\d{3}$/i.test(String(value || '').trim());
}

export default function Landing() {
  const navigate = useNavigate();
  const { login, notice, clearNotice } = useAuth();
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('reg');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState('');
  const [userType, setUserType] = useState('student');

  async function signIn(reg, password) {
    setError('');
    setLoading(true);
    try {
      await login(reg, password);
      navigate(userType === 'staff' ? '/staff/dashboard' : '/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Verification failed. Please check your credentials.'));
    } finally {
      setLoading(false);
      setLoadingDemo('');
    }
  }

  function handleRegSubmit(event) {
    event.preventDefault();
    const reg = registrationNumber.trim().toUpperCase();
    if (!reg) {
      setError(userType === 'student' ? 'Enter your University of Rwanda registration number.' : 'Enter your staff ID.');
      return;
    }
    if (userType === 'student' && !isNineDigits(reg)) {
      setError('Enter the 9-digit registration number (digits only).');
      return;
    }
    if (userType === 'staff' && !isStaffId(reg)) {
      setError('Enter your staff ID (e.g., STAFF001).');
      return;
    }
    setError('');
    clearNotice();
    setStep('pin');
  }

  async function handlePinSubmit(event) {
    event.preventDefault();
    if (!pin.trim()) {
      setError('Enter your password or PIN.');
      return;
    }
    setError('');
    clearNotice();
    await signIn(registrationNumber.trim(), pin.trim());
  }

  async function handleDemo(reg, password) {
    clearNotice();
    setRegistrationNumber(reg);
    setPin(password);
    setStep('pin');
    setLoadingDemo(reg);
    await signIn(reg, password);
  }

  function switchUserType(type) {
    setUserType(type);
    setStep('reg');
    setRegistrationNumber('');
    setPin('');
    setError('');
    clearNotice();
  }

  const currentDemoAccounts = userType === 'student' ? DEMO_ACCOUNTS : STAFF_DEMO_ACCOUNTS;

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <div className="landing-nav-right">
          <span className="pill pill-glass">Student access</span>
          <span className="pill pill-glass">2025/2026</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">University of Rwanda · ExamLab</span>
          <h1>Practise like it's exam day.</h1>
          <p className="hero-lede">
            Past papers, timed mock exams and instant feedback, built for UR students.
          </p>
          <div className="hero-trust">
            {TRUST.map((item) => (
              <span key={item.label} className="hero-trust-item">
                <span className="hero-trust-icon"><item.icon aria-hidden="true" /></span>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-login">
          <div className="user-type-toggle" role="tablist" aria-label="Select user type">
            <button
              role="tab"
              aria-selected={userType === 'student'}
              className={`user-type-btn ${userType === 'student' ? 'active' : ''}`}
              onClick={() => switchUserType('student')}
            >
              <FaUserGraduate aria-hidden="true" />
              <span>Student</span>
            </button>
            <button
              role="tab"
              aria-selected={userType === 'staff'}
              className={`user-type-btn ${userType === 'staff' ? 'active' : ''}`}
              onClick={() => switchUserType('staff')}
            >
              <FaUserTie aria-hidden="true" />
              <span>Staff</span>
            </button>
          </div>

          <h2>{userType === 'student' ? 'Student sign in' : 'Staff sign in'}</h2>
          {(error || notice) && (
            <div className={`alert ${error ? 'alert-error' : 'alert-warning'}`} role="alert">
              {error || notice}
            </div>
          )}
          {step === 'reg' && (
            <form className="access-form" onSubmit={handleRegSubmit}>
              <label className="access-label" htmlFor="registration-number">
                {userType === 'student' ? 'Registration number' : 'Staff ID'}
              </label>
              <div className="access-row">
                <span className="access-prefix" aria-hidden="true">
                  {userType === 'student' ? 'UR' : 'ID'}
                </span>
                <input
                  id="registration-number"
                  className="access-input"
                  value={registrationNumber}
                  onChange={(event) => setRegistrationNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder={userType === 'student' ? 'e.g. 224xxxxxx or 225090098' : 'e.g. STAFF001'}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={userType === 'student' ? 9 : 8}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary access-submit" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm" /> : null}
                  {loading ? 'Checking' : userType === 'student' ? 'Start practising' : 'Continue'}
                </button>
              </div>
              <p className="access-note">
                {userType === 'student'
                  ? 'Use your UR registration number. One active session per student.'
                  : 'Use your UR staff credentials. Lecturers and administrators only.'}
              </p>
            </form>
          )}
          {step === 'pin' && (
            <form className="access-form" onSubmit={handlePinSubmit}>
              <label className="access-label" htmlFor="pin">
                Password / PIN
              </label>
              <div className="access-row">
                <input
                  id="pin"
                  className="access-input"
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="Enter your password or PIN"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary access-submit" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm" /> : null}
                  {loading ? 'Signing in' : 'Sign in'}
                </button>
              </div>
              <p className="access-note">
                {userType === 'student' ? 'Registration number' : 'Staff ID'}: {registrationNumber}
              </p>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => {
                  setStep('reg');
                  setPin('');
                  setError('');
                }}
              >
                Change {userType === 'student' ? 'registration number' : 'staff ID'}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="landing-section">
        <div className="features-two-col">
          <div className="features-col">
            <div className="section-heading">
              <span className="eyebrow">How it works</span>
              <h2>Three steps to better results.</h2>
            </div>
            <div className="workflow-grid workflow-grid-vertical">
              {STEPS.map((item) => (
                <article className="workflow-card workflow-card-modern" key={item.title}>
                  <div className="workflow-card-header">
                    <span className="workflow-icon">
                      <item.icon aria-hidden="true" />
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="features-col">
            <div className="section-heading section-heading-center">
              <span className="eyebrow eyebrow-light">Study support</span>
              <h2>Help when you need it.</h2>
            </div>
            <div className="support-grid support-grid-vertical">
              {SUPPORT.map((feature) => (
                <article className="support-card support-card-modern" key={feature.title}>
                  <span className="support-icon">
                    <feature.icon aria-hidden="true" />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="demo-layout">
          <div className="section-heading">
            <span className="eyebrow">Try it</span>
            <h2>Open a demo {userType === 'student' ? 'student' : 'staff'}.</h2>
            <p>Jump straight in with a sample account.</p>
          </div>
          <div className="demo-grid">
            {currentDemoAccounts.map((account) => {
              const blocked = account.reg === '990012020';
              return (
                <article className={`demo-card ${blocked ? 'demo-blocked' : ''}`} key={account.reg}>
                  <div className="demo-head">
                    <div>
                      <strong>{account.name}</strong>
                      <span>{account.detail}</span>
                    </div>
                    <span className={`pill ${blocked ? 'pill-red' : 'pill-teal'}`}>
                      {blocked ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                  <p>{account.note}</p>
                  <div className="demo-foot">
                    <code>{account.reg}</code>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDemo(account.reg, account.password)}
                      disabled={loading}
                    >
                      {loadingDemo === account.reg ? 'Checking...' : blocked ? 'Test block' : 'Open'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <Logo size="sm" />
        <span>University of Rwanda · ExamLab</span>
        <span>For students · 2025/2026</span>
      </footer>
    </div>
  );
}