import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_TONES = {
  active: 'pill-teal',
  inactive: 'pill-red',
  suspended: 'pill-amber',
  graduated: 'pill-blue',
};

export default function StaffDashboard() {
  const { student, isStaff } = useAuth();
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled([
          api.get('/staff/overview'),
          api.get('/staff/students'),
        ]);
        if (cancelled) return;
        if (results[0].status === 'fulfilled') setOverview(results[0].value.data);
        if (results[1].status === 'fulfilled') setStudents(results[1].value.data.students || []);
        const failure = results.find((result) => result.status === 'rejected');
        if (failure) setError(getErrorMessage(failure.reason));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isStaff) return <Navigate to="/dashboard" replace />;

  const cohort = overview?.cohort;

  return (
    <Layout wide>
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">Staff dashboard</span>
          <h1>Welcome, {student?.fullName || 'Staff member'}.</h1>
          <p className="page-lede">
            Cohort readiness signals for your programme — students, attempts and pass rates.
          </p>
        </div>
        <span className="pill pill-blue">{cohort?.scope || '…'}</span>
      </div>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="page-lede">Loading cohort data…</p>
      ) : (
        <>
          <div className="stat-grid stat-grid-four">
            <StatCard
              label="Students"
              value={cohort?.students ?? '—'}
              hint={`${cohort?.activeStudents ?? 0} active`}
              tone="blue"
            />
            <StatCard label="Modules" value={cohort?.courses ?? '—'} tone="teal" />
            <StatCard label="Graded attempts" value={cohort?.gradedAttempts ?? '—'} tone="amber" />
            <StatCard
              label="Average score"
              value={cohort?.averageScore ? `${cohort.averageScore}%` : '—'}
              tone="green"
            />
            <StatCard
              label="Pass rate"
              value={cohort?.passRate != null ? `${cohort.passRate}%` : '—'}
              tone="green"
            />
          </div>

          <section className="dashboard-section">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Cohort roster</span>
                <h2>Students in your scope</h2>
              </div>
              <span className="muted">{students.length} records</span>
            </div>
            {students.length === 0 ? (
              <div className="empty-inline">No students found for your cohort yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Registration</th>
                      <th>Programme</th>
                      <th>Year</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((entry) => (
                      <tr key={entry.registrationNumber}>
                        <td>
                          <strong>{entry.fullName}</strong>
                        </td>
                        <td>
                          <code>{entry.registrationNumber}</code>
                        </td>
                        <td>{entry.program}</td>
                        <td>{entry.yearOfStudy}</td>
                        <td>
                          <span className={`pill ${STATUS_TONES[entry.enrollmentStatus] || 'pill-blue'}`}>
                            {entry.enrollmentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
