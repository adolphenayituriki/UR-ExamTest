import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { pluralize, toneForPercentage } from '../utils/format.js';
import { useToast } from '../components/Toast.jsx';

const TRACK_LABELS = {
  files: 'File management',
  documents: 'Professional documents',
  presentations: 'Presentations',
  spreadsheets: 'Spreadsheets',
  cloud: 'Cloud sharing',
  email: 'Email & meetings',
  security: 'Online safety',
};

export default function Literacy() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCertificate, setShowCertificate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [lessonsResult, progressResult] = await Promise.allSettled([
          api.get('/literacy'),
          api.get('/literacy/progress'),
        ]);
        if (cancelled) return;
        if (lessonsResult.status === 'fulfilled') setLessons(lessonsResult.value.data.lessons || []);
        if (progressResult.status === 'fulfilled') setProgress(progressResult.value.data.progress || {});
        if (lessonsResult.status === 'rejected') setError(getErrorMessage(lessonsResult.reason));
      } catch {
        // progress endpoint may not exist yet; continue with lessons only
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedCount = Object.values(progress).filter((p) => p.completed).length;

  const trackProgress = useMemo(() => {
    const byTrack = {};
    for (const lesson of lessons) {
      if (!byTrack[lesson.track]) byTrack[lesson.track] = { total: 0, completed: 0 };
      byTrack[lesson.track].total++;
      const p = progress[String(lesson._id)];
      if (p?.completed) byTrack[lesson.track].completed++;
    }
    return byTrack;
  }, [lessons, progress]);

  const overallPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const allCompleted = completedCount === lessons.length && lessons.length > 0;

  if (loading) {
    return (
      <Layout>
        <div className="skeleton-block skeleton-course-header" />
        <div className="assessment-grid">
          {[0, 1, 2, 3, 4].map((item) => (
            <div className="skeleton-block skeleton-assessment" key={item} />
          ))}
        </div>
      </Layout>
    );
  }

  const byTrack = {};
  for (const lesson of lessons) {
    if (!byTrack[lesson.track]) byTrack[lesson.track] = [];
    byTrack[lesson.track].push(lesson);
  }

  return (
    <Layout>
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">Digital literacy</span>
          <h1>Workplace skills for graduates</h1>
          <p className="page-lede">
            Self-paced practical lessons mapped to real job tasks: documents, spreadsheets,
            cloud sharing, email and online safety.
          </p>
        </div>
        <Link className="btn btn-outline" to="/dashboard">
          Back to dashboard
        </Link>
      </div>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

      {/* Overall Progress */}
      <div className="literacy-overall-progress" style={{ marginBottom: '1.5rem' }}>
        <div className="progress-header">
          <div>
            <span className="eyebrow">Overall progress</span>
            <h2>Digital literacy completion</h2>
          </div>
          <div className="progress-percent" style={{ color: overallPercent === 100 ? 'var(--green)' : 'var(--brand)' }}>
            {overallPercent}%
          </div>
        </div>
        <div className="progress-track-lg" style={{ height: '12px', borderRadius: '6px' }}>
          <i style={{ width: `${overallPercent}%`, background: overallPercent === 100 ? 'var(--green)' : 'var(--brand)' }} />
        </div>
        <div className="progress-stats">
          <span>{completedCount} of {lessons.length} lessons completed</span>
          <span>{Object.keys(byTrack).length} skill tracks</span>
        </div>
        {allCompleted && (
          <div className="completion-banner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <strong>Track complete!</strong> You've finished all digital literacy lessons.
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: '12px' }}
                onClick={() => setShowCertificate('all')}
              >
                View certificate
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="stat-grid stat-grid-four" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Lessons"
          value={lessons.length}
          hint="Practical workplace skills"
          tone="blue"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          hint="Lessons finished"
          tone="green"
        />
        <StatCard
          label="Tracks"
          value={Object.keys(byTrack).length}
          hint="Skill areas covered"
          tone="teal"
        />
        <StatCard
          label="Progress"
          value={`${overallPercent}%`}
          hint="Lessons completed"
          tone="amber"
        />
      </div>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Skill tracks</span>
            <h2>Choose a skill track</h2>
          </div>
        </div>

        <div className="literacy-grid">
          {Object.entries(byTrack).map(([track, trackLessons]) => {
            const tp = trackProgress[track] || { total: trackLessons.length, completed: 0 };
            const trackPercent = Math.round((tp.completed / tp.total) * 100);
            const trackComplete = tp.completed === tp.total && tp.total > 0;
            return (
              <article className="track-card" key={track}>
                <div className="track-head">
                  <span className={`pill pill-${toneForPercentage(trackPercent)}`}>
                    {TRACK_LABELS[track] || track}
                  </span>
                  <div className="track-progress-mini">
                    <span className="track-count">
                      {tp.completed}/{tp.total} lessons
                    </span>
                    <div className="track-progress-bar" style={{ width: '100%', maxWidth: '120px' }}>
                      <div className="progress-track" style={{ height: '6px' }}>
                        <i style={{ width: `${trackPercent}%`, background: trackComplete ? 'var(--green)' : 'var(--brand)' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <h3>{trackLessons[0]?.title || track}</h3>
                <p>{trackLessons[0]?.summary || ''}</p>
                <div className="track-progress-text" style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '8px' }}>
                  {trackPercent}% complete · {tp.completed}/{tp.total} lessons
                </div>
                <div className="lesson-list">
                  {trackLessons.map((lesson) => {
                    const lessonProgress = progress[String(lesson._id)];
                    const done = lessonProgress?.completed;
                    return (
                      <Link
                        className={`lesson-row ${done ? 'lesson-done' : ''}`}
                        key={lesson.slug}
                        to={`/literacy/${lesson.slug}`}
                      >
                        <div>
                          <strong>{lesson.title}</strong>
                          <span>{lesson.durationMinutes} min</span>
                        </div>
                        <span className={`pill ${done ? 'pill-green' : 'pill-soft'}`}>
                          {done ? 'Completed' : 'Start'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                {trackComplete && (
                  <div className="track-complete-badge" style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--green-soft)', border: '1px solid var(--green)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--green)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Track complete!</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.7rem' }}
                      onClick={() => setShowCertificate(track)}
                    >
                      Certificate
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {showCertificate && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowCertificate(null)}>
          <div className="modal certificate-modal" role="dialog" aria-modal="true" aria-labelledby="cert-title" onClick={(e) => e.stopPropagation()}>
            <div className="certificate-content">
              <div className="certificate-header">
                <svg className="certificate-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <div>
                  <h2 id="cert-title">Certificate of Completion</h2>
                  <p className="certificate-subtitle">
                    {showCertificate === 'all'
                      ? 'Digital Literacy Program — All Tracks'
                      : `Digital Literacy — ${TRACK_LABELS[showCertificate] || showCertificate}`}
                  </p>
                </div>
              </div>
              <div className="certificate-body">
                <p>This certifies that the student has successfully completed all required lessons</p>
                <p className="certificate-lessons">
                  {showCertificate === 'all'
                    ? `${lessons.length} lessons across ${Object.keys(byTrack).length} skill tracks`
                    : `${trackProgress[showCertificate]?.completed || 0} lessons in ${TRACK_LABELS[showCertificate] || showCertificate}`}
                </p>
                <div className="certificate-date">
                  Issued: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="certificate-footer">
                <div className="certificate-seal">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <strong>University of Rwanda</strong>
                  <span>Digital Literacy Programme</span>
                </div>
              </div>
              <div className="certificate-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    // In a real app, this would generate a PDF
                    toast('Certificate download would be implemented here', 'info');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCertificate(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
