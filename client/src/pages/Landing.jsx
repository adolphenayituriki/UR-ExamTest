import { useState, useEffect } from 'react';
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

const ICON_MAP = {
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
};

function getIcon(iconName) {
  return ICON_MAP[iconName] || FaClock;
}

function isNineDigits(value) {
  return /^\d{9}$/.test(String(value || '').trim());
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
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
  const [landingData, setLandingData] = useState(null);
  const [landingLoading, setLandingLoading] = useState(true);

  useEffect(() => {
    async function fetchLandingContent() {
      try {
        const response = await api.get('/landing');
        setLandingData(response.data);
      } catch (err) {
        console.error('Failed to fetch landing content:', err);
      } finally {
        setLandingLoading(false);
      }
    }
    fetchLandingContent();
  }, []);

  const trust = landingData?.trust || [];
  const steps = landingData?.steps || [];
  const features = landingData?.features || [];
  const support = landingData?.support || [];
  const demoAccounts = landingData?.demoAccounts || [];
  const sections = landingData?.sections || [];
  const footer = landingData?.footer || {};
  const hero = landingData?.hero || {};

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

  const currentDemoAccounts = demoAccounts.filter((acc) => acc.userType === userType);

  if (landingLoading) {
    return (
      <div className="landing">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <span className="spinner" />
        </div>
      </div>
    );
  }

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
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="nav-link" onClick={() => setShowNav(false)}>
                    {section.eyebrow.replace('How it works', 'How it works').replace('Platform features', 'Features').replace('Study support', 'Support').replace('Try it', 'Demo accounts')}
                  </a>
                </li>
              ))}
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
                <span className="eyebrow">{hero.eyebrow || 'University of Rwanda · ExamLab'}</span>
                <h1 id="hero-title">{hero.title || "Practise like it's exam day."}</h1>
              </div>
              <p className="hero-lede">{hero.lede || 'Past papers, timed mock exams and instant feedback, built for UR students.'}</p>
              <div className="hero-trust-row">
                <div className="hero-trust">
                  {trust.map((item) => {
                    const Icon = getIcon(item.icon);
                    return (
                      <span key={item.label} className="hero-trust-item">
                        <span className="hero-trust-icon"><Icon aria-hidden="true" /></span>
                        {item.label}
                      </span>
                    );
                  })}
                </div>
                <div className="hero-badges">
                  {(hero.badges || []).map((badge, idx) => (
                    <span key={idx} className={`badge badge-${badge.variant || 'glass'}`}>
                      {badge.text}
                    </span>
                  ))}
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

        {sections.map((section) => (
          <section key={section.id} id={section.id} className={`landing-section ${section.altBackground ? 'landing-section-alt' : ''}`} aria-labelledby={`${section.id}-title`}>
            <div className="section-header">
              <span className="eyebrow">{section.eyebrow}</span>
              <h2 id={`${section.id}-title`}>{section.title.replace('{userType}', userType === 'student' ? 'student' : 'staff')}</h2>
              <p className="section-lede">{section.lede}</p>
            </div>
            {section.id === 'how-it-works' && (
              <div className="steps-grid">
                {steps.map((item, index) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <article className="step-card" key={item.title}>
                      <div className="step-number">{item.step}</div>
                      <div className="step-icon" style={{ background: item.bgColor, color: item.color }}>
                        <Icon aria-hidden="true" />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                      <div className="step-connector" aria-hidden="true">
                        {index < steps.length - 1 && <span></span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {section.id === 'features' && (
              <div className="features-grid">
                {features.map((feature) => {
                  const Icon = getIcon(feature.icon);
                  return (
                    <article className="feature-card" key={feature.title}>
                      <div className="feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                        <Icon aria-hidden="true" />
                      </div>
                      <h3>{feature.title}</h3>
                      <p>{feature.text}</p>
                    </article>
                  );
                })}
              </div>
            )}
            {section.id === 'support' && (
              <div className="support-grid support-grid-vertical">
                {support.map((feature) => {
                  const Icon = getIcon(feature.icon);
                  return (
                    <article className="support-card support-card-modern" key={feature.title}>
                      <div className="support-card-glow" style={{ background: `radial-gradient(circle, ${feature.color}20 0%, transparent 70%)` }} />
                      <span className="support-icon" style={{ background: feature.bgColor, color: feature.color }}>
                        <Icon aria-hidden="true" />
                      </span>
                      <h3>{feature.title}</h3>
                      <p>{feature.text}</p>
                    </article>
                  );
                })}
              </div>
            )}
            {section.id === 'demo' && (
              <div className="demo-grid">
                {currentDemoAccounts.map((account) => {
                  const blocked = account.blocked;
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
            )}
          </section>
        ))}

      </main>

      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo size="sm" />
            <div>
              <strong>{footer.brandText || 'University of Rwanda · ExamLab'}</strong>
              <span>{footer.brandSubtext || 'For students · 2025/2026'}</span>
            </div>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            {(footer.links || []).map((link, idx) => (
              <a key={idx} href={link.href}>{link.label}</a>
            ))}
          </nav>
          <div className="footer-legal">
            {(footer.legal || []).map((item, idx) => (
              <span key={idx}>{item.text}</span>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <p>{footer.bottomText || 'Server-timed · AI-assisted · Integrity monitored'}</p>
        </div>
      </footer>
    </div>
  );
}