import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client.js';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import {
  FaClock,
  FaCheckDouble,
  FaBook,
  FaGraduationCap,
  FaUsers,
  FaLightbulb,
  FaUserTie,
  FaUserGraduate,
  FaLock,
  FaShield,
  FaBolt,
  FaBrain,
  FaAward,
} from 'react-icons/fa6';

const DEMO_ACCOUNTS = [
  {
    reg: '223452022',
    password: 'DemoPass1',
    name: 'NAYITURIKI Adolphe',
    detail: 'Software Engineering · Year 4',
    note: 'Full history and results',
    avatar: 'NA',
  },
  {
    reg: '233462023',
    password: 'DemoPass2',
    name: 'MUKAMANA Alice',
    detail: 'Software Engineering · Year 3',
    note: 'Year 3 dashboard',
    avatar: 'MA',
  },
  {
    reg: '243472024',
    password: 'DemoPass3',
    name: 'HABIMANA Eric',
    detail: 'Software Engineering · Year 2',
    note: 'Practice and mocks',
    avatar: 'HE',
  },
  {
    reg: '990012020',
    password: 'DemoPass6',
    name: 'KAMIKAZI Claudine',
    detail: 'Inactive enrollment',
    note: 'Shows an inactive record',
    avatar: 'KC',
  },
];

const STAFF_DEMO_ACCOUNTS = [
  {
    email: 'jean.uwizeyimana@ur.ac.rw',
    password: 'StaffPass1',
    name: 'Dr. UWIZEYIMANA Jean',
    detail: 'Lecturer · Computer Science',
    note: 'Manage courses & assessments',
    avatar: 'UJ',
  },
  {
    email: 'grace.mukeshimana@ur.ac.rw',
    password: 'StaffPass2',
    name: 'Prof. MUKESHIMANA Grace',
    detail: 'Senior Lecturer · Software Engineering',
    note: 'Review student analytics',
    avatar: 'MG',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Choose a course',
    text: 'Browse modules for your year and programme. Past papers and practice exams are organised by department.',
    icon: FaGraduationCap,
    color: 'var(--brand)',
    bgColor: 'var(--brand-soft)',
  },
  {
    step: '02',
    title: 'Practise or take a mock',
    text: 'Timed questions with instant marking. AI-powered hints guide your method without giving answers.',
    icon: FaClock,
    color: 'var(--accent)',
    bgColor: 'var(--accent-soft)',
  },
  {
    step: '03',
    title: 'Fix weak topics',
    text: 'Review detailed feedback and focus your revision. Track progress across attempts and topics.',
    icon: FaBook,
    color: 'var(--green)',
    bgColor: 'var(--green-soft)',
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
    text: 'Get a nudge without the answer. Socratic AI hints explain the method and next step.',
    icon: FaLightbulb,
    color: 'var(--accent)',
    bgColor: 'var(--accent-soft)',
  },
  {
    title: 'Weak spot detection',
    text: 'See which topics need more work. Analytics highlight low-scoring areas across attempts.',
    icon: FaUsers,
    color: 'var(--brand)',
    bgColor: 'var(--brand-soft)',
  },
  {
    title: 'Fresh questions',
    text: 'New numbers each attempt, so you learn the method — not just memorise answers.',
    icon: FaBrain,
    color: 'var(--green)',
    bgColor: 'var(--green-soft)',
  },
];

const FEATURES = [
  {
    title: 'Server-timed exams',
    text: 'Clock runs on the server — no client-side manipulation possible.',
    icon: FaClock,
    color: 'var(--brand)',
  },
  {
    title: 'Integrity monitoring',
    text: 'Tab-switch detection with configurable strikes before auto-submit.',
    icon: FaShield,
    color: 'var(--red)',
  },
  {
    title: 'AI-powered grading',
    text: 'Essay and short-answer responses graded by LLM with rubric alignment.',
    icon: FaBrain,
    color: 'var(--accent)',
  },
  {
    title: 'Instant certificates',
    text: 'Verifiable completion badges and PDF certificates for literacy tracks.',
    icon: FaAward,
    color: 'var(--green)',
  },
  {
    title: 'Offline-ready PWA',
    text: 'Install as an app. Past papers and literacy lessons cached for offline study.',
    icon: FaBolt,
    color: 'var(--purple)',
  },
  {
    title: 'Accessibility first',
    text: 'WCAG 2.1 AA compliant. Keyboard navigation, screen readers, high contrast.',
    icon: FaUserGraduate,
    color: 'var(--ink)',
  },
];

function isNineDigits(value) {
  return /^\d{9}$/.test(String(value || '').trim());
}

export default function Landing() {
  const navigate = useNavigate();
  const { login, notice, clearNotice } = useAuth();
  const { toast } = useToast();
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('reg');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState('');
  const [userType, setUserType] = useState('student');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showNav, setShowNav] = useState(false);

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
    setError('');
    clearNotice();

    if (userType === 'student') {
      setStep('pin');
    }
  }

  async function handleStaffLogin(event) {
    event.preventDefault();
    const email = staffEmail.trim().toLowerCase();
    const password = staffPassword;
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/staff/login', { email, password });
      setRegistrationNumber(response.data.staffId);
      setOtpSent(true);
      setStep('otp-verify');
      setOtpCode('');
      startResendTimer();
      toast('OTP sent to your registered email.', 'success');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  }

  async function resendOTP() {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/staff/login', { email: staffEmail.trim().toLowerCase(), password: staffPassword });
      setRegistrationNumber(response.data.staffId);
      startResendTimer();
      toast('New OTP sent to your email.', 'success');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend OTP.'));
    } finally {
      setLoading(false);
    }
  }

  function startResendTimer() {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
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

  async function handleOtpVerify(event) {
    event.preventDefault();
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/staff/otp/verify', {
        staffId: registrationNumber.trim().toUpperCase(),
        code,
      });
      const { token, student } = response.data;
      localStorage.setItem('examlab_token', token);
      localStorage.setItem('examlab_student', JSON.stringify(student));
      navigate('/staff/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired code.'));
    } finally {
      setLoading(false);
    }
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
    setOtpCode('');
    setOtpSent(false);
    setResendTimer(0);
    setStaffEmail('');
    setStaffPassword('');
    setError('');
    clearNotice();
  }

  const currentDemoAccounts = userType === 'student' ? DEMO_ACCOUNTS : STAFF_DEMO_ACCOUNTS;

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand">
            <Logo />
            <div className="landing-brand-text">
              <span className="landing-brand-name">ExamLab</span>
              <span className="landing-brand-sub">University of Rwanda</span>
            </div>
          </div>

          <nav className="landing-nav" role="navigation" aria-label="Main navigation">
            <button
              className="landing-nav-toggle"
              onClick={() => setShowNav(!showNav)}
              aria-expanded={showNav}
              aria-controls="landing-nav-menu"
              aria-label={showNav ? 'Close menu' : 'Open menu'}
            >
              <span className="hamburger" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>

            <ul id="landing-nav-menu" className={`landing-nav-menu ${showNav ? 'open' : ''}`}>
              <li><a href="#how-it-works" className="nav-link" onClick={() => setShowNav(false)}>How it works</a></li>
              <li><a href="#features" className="nav-link" onClick={() => setShowNav(false)}>Features</a></li>
              <li><a href="#demo" className="nav-link" onClick={() => setShowNav(false)}>Demo accounts</a></li>
              <li><a href="#support" className="nav-link" onClick={() => setShowNav(false)}>Support</a></li>
            </ul>
          </nav>

          <div className="landing-header-actions">
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
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-orb hero-orb-1"></div>
            <div className="hero-orb hero-orb-2"></div>
            <div className="hero-orb hero-orb-3"></div>
          </div>

          <div className="hero-content">
            <div className="hero-copy">
              <div className="hero-copy-header">
                <span className="eyebrow">University of Rwanda · ExamLab</span>
                <h1 id="hero-title">Practise like it&apos;s exam day.</h1>
              </div>
              <p className="hero-lede">
                Past papers, timed mock exams and instant feedback, built for UR students.
              </p>
              <div className="hero-trust-row">
                <div className="hero-trust">
                  {TRUST.map((item) => (
                    <span key={item.label} className="hero-trust-item">
                      <span className="hero-trust-icon"><item.icon aria-hidden="true" /></span>
                      {item.label}
                    </span>
                  ))}
                </div>
                <div className="hero-badges">
                  <span className="badge badge-glass">Student access</span>
                  <span className="badge badge-glass">2025/2026</span>
                  <span className="badge badge-glass">Secure & Verified</span>
                </div>
              </div>
            </div>

            <div className="hero-login-card">
              <div className="hero-login-header">
                <h2>{userType === 'student' ? 'Student sign in' : 'Staff sign in'}</h2>
                <p className="hero-login-subtitle">
                  {userType === 'student'
                    ? 'Enter your 9-digit registration number to begin.'
                    : 'Sign in with your UR email and password, then verify with OTP.'}
                </p>
              </div>

              {(error || notice) && (
                <div className={`alert ${error ? 'alert-error' : 'alert-warning'}`} role="alert">
                  {error || notice}
                </div>
              )}

              {step === 'reg' && userType === 'student' && (
                <form className="access-form" onSubmit={handleRegSubmit}>
                  <div className="access-field">
                    <label className="access-label" htmlFor="registration-number">
                      Registration number
                    </label>
                    <div className="access-row">
                      <span className="access-prefix" aria-hidden="true">
                        <strong>UR</strong>
                      </span>
                      <input
                        id="registration-number"
                        className="access-input"
                        value={registrationNumber}
                        onChange={(event) => setRegistrationNumber(event.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 224001234"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={9}
                        disabled={loading}
                        inputMode="numeric"
                      />
                      <button type="submit" className="btn btn-primary access-submit" disabled={loading}>
                        {loading ? <span className="spinner spinner-sm" /> : null}
                        {loading ? 'Checking…' : 'Start practising'}
                      </button>
                    </div>
                  </div>
                  <p className="access-note">
                    Use your UR registration number. One active session per student.
                  </p>
                </form>
              )}

              {step === 'reg' && userType === 'staff' && (
                <form className="access-form" onSubmit={handleStaffLogin}>
                  <div className="access-field">
                    <label className="access-label" htmlFor="staff-email">
                      Email address
                    </label>
                    <div className="access-row">
                      <span className="access-prefix" aria-hidden="true">
                        @
                      </span>
                      <input
                        id="staff-email"
                        className="access-input"
                        type="email"
                        value={staffEmail}
                        onChange={(event) => setStaffEmail(event.target.value.toLowerCase())}
                        placeholder="your.name@ur.ac.rw"
                        autoComplete="email"
                        spellCheck={false}
                        disabled={loading}
                      />
                      <button type="submit" className="btn btn-primary access-submit" disabled={loading}>
                        {loading ? <span className="spinner spinner-sm" /> : null}
                        {loading ? 'Checking…' : 'Continue'}
                      </button>
                    </div>
                  </div>

                  <div className="access-field">
                    <label className="access-label" htmlFor="staff-password">
                      Password
                    </label>
                    <div className="access-row">
                      <span className="access-prefix" aria-hidden="true">
                        <FaLock aria-hidden="true" />
                      </span>
                      <input
                        id="staff-password"
                        className="access-input"
                        type="password"
                        value={staffPassword}
                        onChange={(event) => setStaffPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        spellCheck={false}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <p className="access-note">
                    After verification, a one-time code will be sent to your email.
                  </p>
                </form>
              )}

              {userType === 'staff' && step === 'otp-verify' && (
                <form className="access-form" onSubmit={handleOtpVerify}>
                  <div className="otp-header">
                    <div className="otp-icon">
                      <FaLock aria-hidden="true" />
                    </div>
                    <div>
                      <h3>Check your email</h3>
                      <p>We&apos;ve sent a 6-digit code to <strong>{otpSent && maskEmail(staffEmail)}</strong></p>
                    </div>
                  </div>

                  <div className="access-field">
                    <label className="access-label" htmlFor="otp-code">
                      One-time code
                    </label>
                    <div className="access-row otp-row">
                      <input
                        id="otp-code"
                        className="access-input otp-input"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •"
                        autoComplete="one-time-code"
                        spellCheck={false}
                        maxLength={6}
                        disabled={loading}
                        inputMode="numeric"
                      />
                      <button type="submit" className="btn btn-primary access-submit" disabled={loading}>
                        {loading ? <span className="spinner spinner-sm" /> : null}
                        {loading ? 'Verifying…' : 'Verify & sign in'}
                      </button>
                    </div>
                  </div>
                  <p className="access-note">
                    Code expires in 10 minutes. <span className={resendTimer > 0 ? 'text-warning' : ''}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : ''}
                    </span>
                  </p>
                  <div className="otp-actions">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={resendOTP}
                      disabled={resendTimer > 0 || loading}
                    >
                      {resendTimer > 0 ? `Resend code ({resendTimer}s)` : 'Resend code'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => {
                        setStep('reg');
                        setOtpCode('');
                        setOtpSent(false);
                        setError('');
                      }}
                    >
                      Change email
                    </button>
                  </div>
                </form>
              )}

              {userType === 'student' && step === 'pin' && (
                <form className="access-form" onSubmit={handlePinSubmit}>
                  <div className="access-field">
                    <label className="access-label" htmlFor="pin">
                      Password / PIN
                    </label>
                    <div className="access-row">
                      <span className="access-prefix" aria-hidden="true">
                        <FaLock aria-hidden="true" />
                      </span>
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
                        {loading ? 'Signing in…' : 'Sign in'}
                      </button>
                    </div>
                  </div>
                  <p className="access-note">
                    Registration number: <strong>{registrationNumber}</strong>
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
                    Change registration number
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-section" aria-labelledby="how-title">
          <div className="section-header">
            <span className="eyebrow">How it works</span>
            <h2 id="how-title">Three steps to better results.</h2>
            <p className="section-lede">From choosing your course to mastering weak topics — a streamlined path to exam readiness.</p>
          </div>
          <div className="steps-grid">
            {STEPS.map((item, index) => (
              <article className="step-card" key={item.title}>
                <div className="step-number">{item.step}</div>
                <div className="step-icon" style={{ background: item.bgColor, color: item.color }}>
                  <item.icon aria-hidden="true" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className="step-connector" aria-hidden="true">
                  {index < STEPS.length - 1 && <span></span>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="landing-section landing-section-alt" aria-labelledby="features-title">
          <div className="section-header">
            <span className="eyebrow">Platform features</span>
            <h2 id="features-title">Built for integrity, speed and learning.</h2>
            <p className="section-lede">Every feature designed around real exam conditions and pedagogical best practices.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                  <feature.icon aria-hidden="true" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="support" className="landing-section" aria-labelledby="support-title">
          <div className="section-header">
            <span className="eyebrow">Study support</span>
            <h2 id="support-title">Help when you need it.</h2>
            <p className="section-lede">Smart tools that guide your revision without doing the work for you.</p>
          </div>
          <div className="support-grid support-grid-vertical">
            {SUPPORT.map((feature) => (
              <article className="support-card support-card-modern" key={feature.title}>
                <div className="support-card-glow" style={{ background: `radial-gradient(circle, ${feature.color}20 0%, transparent 70%)` }} />
                <span className="support-icon" style={{ background: feature.bgColor, color: feature.color }}>
                  <feature.icon aria-hidden="true" />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="demo" className="landing-section landing-section-alt" aria-labelledby="demo-title">
          <div className="section-header">
            <span className="eyebrow">Try it</span>
            <h2 id="demo-title">Open a demo {userType === 'student' ? 'student' : 'staff'}.</h2>
            <p className="section-lede">Jump straight in with a sample account — no registration needed.</p>
          </div>
          <div className="demo-grid">
            {currentDemoAccounts.map((account) => {
              const blocked = account.reg === '990012020';
              return (
                <article className={`demo-card ${blocked ? 'demo-blocked' : ''}`} key={account.reg || account.email}>
                  <div className="demo-avatar" aria-hidden="true">
                    {account.avatar}
                  </div>
                  <div className="demo-info">
                    <div className="demo-name-row">
                      <strong>{account.name}</strong>
                      <span className={`pill ${blocked ? 'pill-red' : 'pill-teal'}`}>
                        {blocked ? 'Inactive' : 'Active'}
                      </span>
                    </div>
                    <span className="demo-detail">{account.detail}</span>
                  </div>
                  <p className="demo-note">{account.note}</p>
                  <div className="demo-foot">
                    <code>{account.reg || account.email}</code>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (userType === 'student') {
                          handleDemo(account.reg, account.password);
                        } else {
                          setStaffEmail(account.email);
                          setStaffPassword(account.password);
                          handleStaffLogin({ preventDefault: () => {} });
                        }
                      }}
                      disabled={loading}
                    >
                      {loadingDemo === (account.reg || account.email) ? 'Loading…' : blocked ? 'Test block' : 'Open'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo size="sm" />
            <div>
              <strong>University of Rwanda · ExamLab</strong>
              <span>For students · 2025/2026</span>
            </div>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#demo">Demo accounts</a>
            <a href="#support">Support</a>
          </nav>
          <div className="footer-legal">
            <span>© {new Date().getFullYear()} University of Rwanda</span>
            <span>Secure examination environment</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Server-timed · AI-assisted · Integrity monitored</p>
        </div>
      </footer>
    </div>
  );
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}