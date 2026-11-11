import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Logo from '../components/Logo.jsx';
import DarkModeToggle from '../components/DarkModeToggle.jsx';
import { formatDate } from '../utils/format.js';

export default function VerifyCredential() {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(routeCode || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verify = useCallback(async (value) => {
    const target = String(value || '').trim().toUpperCase();
    if (!target) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.get(`/credentials/verify/${encodeURIComponent(target)}`);
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeCode) verify(routeCode);
  }, [routeCode, verify]);

  function handleSubmit(event) {
    event.preventDefault();
    const target = code.trim().toUpperCase();
    if (!target) return;
    if (target !== String(routeCode || '').toUpperCase()) {
      navigate(`/verify/${encodeURIComponent(target)}`);
    } else {
      verify(target);
    }
  }

  const credential = result?.credential;

  return (
    <div className="public-shell">
      <header className="public-header">
        <Link to="/" className="brand-link" aria-label="UR ExamLab home">
          <Logo />
        </Link>
        <div className="public-header-actions">
          <DarkModeToggle />
          <Link to="/" className="btn btn-outline btn-sm">
            Back to ExamLab
          </Link>
        </div>
      </header>

      <main className="page public-page">
        <div className="dashboard-head">
          <div>
            <span className="eyebrow">Public verification</span>
            <h1>Verify a UR ExamLab credential</h1>
            <p className="page-lede">
              Employers and institutions can confirm that an annual exam-readiness
              credential was issued by the University of Rwanda ExamLab and has not
              been revoked or altered.
            </p>
          </div>
        </div>

        <section className="dashboard-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Credential lookup</span>
              <h2>Enter the credential code</h2>
            </div>
          </div>

          <form className="verify-card" onSubmit={handleSubmit}>
            <div className="verify-form">
              <label className="verify-label" htmlFor="credential-code">
                Credential code
              </label>
              <div className="verify-row">
                <input
                  id="credential-code"
                  className="input input-verify"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="e.g. UR-EXAM-2025-26-AB12CD34"
                  spellCheck={false}
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !code.trim()}
                >
                  {loading ? 'Verifying…' : 'Verify credential'}
                </button>
              </div>
              <p className="muted">
                The code appears on the student&apos;s credential document. No sign-in is required.
              </p>
            </div>
          </form>
        </section>

        {error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : null}

        {result ? (
          <section className="dashboard-section">
            <div className={`verify-result ${result.valid ? 'verify-valid' : 'verify-invalid'}`}>
              <span className={`pill ${result.valid ? 'pill-green' : 'pill-red'}`}>
                {result.valid ? 'Authentic' : 'Not verified'}
              </span>
              <div>
                <strong>{credential?.title || 'Credential'}</strong>
                <span>{result.reason}</span>
              </div>
              <div>
                <strong>Signature</strong>
                <span>{result.signatureValid ? 'Valid' : 'Invalid'}</span>
              </div>
              <div>
                <strong>Status</strong>
                <span>{result.notRevoked ? 'Issued' : 'Revoked'}</span>
              </div>
              <div>
                <strong>Expiry</strong>
                <span>{result.notExpired ? 'Current' : 'Expired'}</span>
              </div>
            </div>

            {credential ? (
              <article className="credential-card">
                <div className="credential-body">
                  <div className="credential-issuer">
                    <strong>{credential.issuer?.name || 'University of Rwanda ExamLab'}</strong>
                    <span>Open Badges 3.0 · W3C Verifiable Credential</span>
                  </div>
                  <h2>{credential.title}</h2>
                  <p>{credential.description}</p>
                  <div className="credential-meta">
                    <div>
                      <span>Credential code</span>
                      <strong>{credential.code}</strong>
                    </div>
                    <div>
                      <span>Academic year</span>
                      <strong>{credential.academicYear}</strong>
                    </div>
                    <div>
                      <span>Issued</span>
                      <strong>{formatDate(credential.issuedAt)}</strong>
                    </div>
                    <div>
                      <span>Expires</span>
                      <strong>{formatDate(credential.expiresAt)}</strong>
                    </div>
                    {credential.student ? (
                      <>
                        <div>
                          <span>Holder</span>
                          <strong>{credential.student.fullName}</strong>
                        </div>
                        <div>
                          <span>Registration</span>
                          <strong>{credential.student.registrationNumber}</strong>
                        </div>
                        <div>
                          <span>Programme</span>
                          <strong>{credential.student.program}</strong>
                        </div>
                        <div>
                          <span>College</span>
                          <strong>{credential.student.college}</strong>
                        </div>
                      </>
                    ) : null}
                  </div>
                  {credential.evidence ? (
                    <p className="muted">
                      Verified record: {credential.evidence.gradedAttempts} graded attempts ·{' '}
                      {credential.evidence.averagePercentage}% average ·{' '}
                      {credential.evidence.passRate}% pass rate.
                    </p>
                  ) : null}
                </div>
              </article>
            ) : null}
          </section>
        ) : null}
      </main>

      <footer className="app-footer">
        <Logo size="sm" />
        <span>Public credential verification · University of Rwanda ExamLab</span>
      </footer>
    </div>
  );
}
