import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { formatDate } from '../utils/format.js';

export default function Credentials() {
  const [eligibility, setEligibility] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [eligibilityResult, credentialsResult] = await Promise.allSettled([
        api.get('/credentials/eligibility'),
        api.get('/credentials/mine'),
      ]);
      if (eligibilityResult.status === 'fulfilled') {
        setEligibility(eligibilityResult.value.data);
      } else {
        setError(getErrorMessage(eligibilityResult.reason));
      }
      if (credentialsResult.status === 'fulfilled') {
        setCredentials(credentialsResult.value.data.credentials || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const issueCredential = useCallback(async () => {
    setError('');
    setIssuing(true);
    try {
      await api.post('/credentials/issue', {
        academicYear: eligibility?.academicYear,
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIssuing(false);
    }
  }, [eligibility?.academicYear, loadData]);

  async function verify() {
    if (!verifyCode.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const response = await api.get(`/credentials/verify/${verifyCode.trim()}`);
      setVerifyResult(response.data);
    } catch (err) {
      setVerifyResult({ valid: false, reason: getErrorMessage(err) });
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="skeleton-block skeleton-course-header" />
      </Layout>
    );
  }

  const metrics = eligibility?.metrics || {};
  const checks = eligibility?.checks || [];
  const eligible = eligibility?.eligible;
  const alreadyIssued = eligibility?.alreadyIssued;
  const academicYear = eligibility?.academicYear || '—';

  return (
    <Layout>
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">Verifiable annual credential</span>
          <h1>UR ExamLab Exam-Readiness Credential</h1>
          <p className="page-lede">
            A portable, machine-verifiable credential issued on Open Badges 3.0 / W3C
            Verifiable Credentials. Verified by employers through a public verification page.
          </p>
        </div>
        <Link className="btn btn-outline" to="/dashboard">
          Back to dashboard
        </Link>
      </div>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

      {alreadyIssued && credentials.length ? (
        <section className="dashboard-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Your credential</span>
              <h2>Issued — {academicYear}</h2>
            </div>
          </div>
          <div className="credential-card">
            <div className="credential-body">
              <div className="credential-issuer">
                <strong>University of Rwanda ExamLab</strong>
                <span>Open Badges 3.0 · W3C Verifiable Credential</span>
              </div>
              <h2>{credentials[0]?.title || 'Annual Exam-Readiness Credential'}</h2>
              <p>{credentials[0]?.description || ''}</p>
              <div className="credential-meta">
                <div>
                  <span>Credential code</span>
                  <strong>{credentials[0]?.code}</strong>
                </div>
                <div>
                  <span>Academic year</span>
                  <strong>{credentials[0]?.academicYear}</strong>
                </div>
                <div>
                  <span>Issued</span>
                  <strong>{formatDate(credentials[0]?.issuedAt)}</strong>
                </div>
                <div>
                  <span>Expires</span>
                  <strong>{formatDate(credentials[0]?.expiresAt)}</strong>
                </div>
              </div>
            </div>
            <div className="credential-actions">
              <button type="button" className="btn btn-outline" onClick={() => setVerifyCode(credentials[0]?.code)}>
                Verify this credential
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {!alreadyIssued && eligibility && (
        <>
          <section className="dashboard-section">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Eligibility — {academicYear}</span>
                <h2>Annual credential criteria</h2>
              </div>
            </div>

            <div className="stat-grid stat-grid-four" style={{ marginBottom: '1rem' }}>
              <StatCard
                label="Graded attempts"
                value={metrics.gradedAttempts}
                hint={`Target ${checks.find((c) => c.key === 'gradedAttempts')?.target}`}
                tone={checks.find((c) => c.key === 'gradedAttempts')?.met ? 'green' : 'red'}
              />
              <StatCard
                label="Average score"
                value={`${metrics.averagePercentage}%`}
                hint={`Target ${checks.find((c) => c.key === 'averagePercentage')?.target}%`}
                tone={checks.find((c) => c.key === 'averagePercentage')?.met ? 'green' : 'red'}
              />
              <StatCard
                label="Pass rate"
                value={`${metrics.passRate}%`}
                hint={`Target ${checks.find((c) => c.key === 'passRate')?.target}%`}
                tone={checks.find((c) => c.key === 'passRate')?.met ? 'green' : 'red'}
              />
              <StatCard
                label="Study time"
                value={metrics.studyMinutes + ' min'}
                hint={`Target ${checks.find((c) => c.key === 'studyMinutes')?.target} min`}
                tone={checks.find((c) => c.key === 'studyMinutes')?.met ? 'green' : 'red'}
              />
            </div>

            <div className="criteria-list">
              {checks.map((check) => (
                <div className="criteria-row" key={check.key}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.value} of {check.target}</span>
                  </div>
                  <span className={`pill ${check.met ? 'pill-green' : 'pill-soft'}`}>
                    {check.met ? 'Met' : 'Not met'}
                  </span>
                </div>
              ))}
            </div>

            <div className="eligibility-banner">
              {eligible ? (
                <span className="pill pill-green">You meet all criteria for this academic year.</span>
              ) : (
                <span className="pill pill-red">
                  Complete the unmet criteria above to unlock the credential.
                </span>
              )}
            </div>

            <div className="credential-actions">
              {eligible && !alreadyIssued ? (
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={issueCredential}
                  disabled={issuing}
                >
                  {issuing ? 'Issuing…' : 'Issue credential'}
                </button>
              ) : alreadyIssued ? (
                <span className="pill pill-green">Credential already issued this year.</span>
              ) : null}
            </div>
          </section>
        </>
      )}

      <section className="dashboard-section" style={{ marginTop: '1.5rem' }}>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Verify any credential</span>
            <h2>Public verification</h2>
          </div>
        </div>
        <div className="verify-card">
          <div className="verify-form">
            <label className="verify-label">Credential code</label>
            <div className="verify-row">
              <input
                className="input input-verify"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="e.g. UR-EXAM-2025-26-AB12"
                spellCheck={false}
                disabled={verifying}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={verify}
                disabled={verifying || !verifyCode.trim()}
              >
                {verifying ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </div>
          {verifyResult && (
            <div className={`verify-result ${verifyResult.valid ? 'verify-valid' : 'verify-invalid'}`}>
              <span className={`pill ${verifyResult.valid ? 'pill-green' : 'pill-red'}`}>
                {verifyResult.valid ? 'Valid' : 'Invalid'}
              </span>
              <div>
                <strong>{verifyResult.credential?.title || '—'}</strong>
                <span>{verifyResult.reason}</span>
              </div>
              {verifyResult.credential?.student && (
                <div>
                  <span>{verifyResult.credential.student.fullName}</span>
                  <span>({verifyResult.credential.student.registrationNumber})</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {!eligibility && !alreadyIssued ? (
        <div className="empty-inline">
          Unable to load eligibility. Please try again or contact support.
        </div>
      ) : null}
    </Layout>
  );
}
