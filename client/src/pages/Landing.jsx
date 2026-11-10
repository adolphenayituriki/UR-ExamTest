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

export default function Landing() {
  const navigate = useNavigate();
  const { login, notice, clearNotice } = useAuth();
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('reg');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState('');

  async function signIn(reg, password) {
    setError('');
    setLoading(true);
    try {
      await login(reg, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Verification failed. Please check your registration number.'));
    } finally {
      setLoading(false);
      setLoadingDemo('');
    }
  }

  function handleRegSubmit(event) {
    event.preventDefault();
    const reg = registrationNumber.trim();
    if (!reg) {
      setError('Enter your University of Rwanda registration number.');
      return;
    }
    if (!isNineDigits(reg)) {
      setError('Enter the 9-digit registration number (digits only).');
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
          <h1>Practise like it’s exam day.</h1>
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
          <h2>Student sign in</h2>
          {(error || notice) && (
            <div className={`alert ${error ? 'alert-error' : 'alert-warning'}`} role="alert">
              {error || notice}
            </div>
          )}
          {step === 'reg' && (
            <form className="access-form" onSubmit={handleRegSubmit}>
              <label className="access-label" htmlFor="registration-number">
                Registration number
              </label>
              <div className="access-row">
                <span className="access-prefix" aria-hidden="true">
                  UR
                </span>
                <input
                  id="registration-number"
                  className="access-input"
                  value={registrationNumber}
                  onChange={(event) => setRegistrationNumber(event.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 224xxxxxx or 225090098"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={9}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary access-submit" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm" /> : null}
                  {loading ? 'Checking' : 'Start practising'}
                </button>
              </div>
              <p className="access-note">
                Use your UR registration number. One active session per student.
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
                Registration number: {registrationNumber}
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
            <h2>Open a demo student.</h2>
            <p>Jump straight in with a sample account.</p>
          </div>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map((account) => {
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
                      {loadingDemo === account.reg ? 'Checking…' : blocked ? 'Test block' : 'Open'}
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
