import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { pluralize, toneForPercentage } from '../utils/format.js';

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
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                value={`${lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0}%`}
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
          {Object.entries(byTrack).map(([track, trackLessons]) => (
            <article className="track-card" key={track}>
              <div className="track-head">
                <span className={`pill pill-${toneForPercentage(50)}`}>
                  {TRACK_LABELS[track] || track}
                </span>
                <span className="track-count">
                  {trackLessons.length} lesson{trackLessons.length === 1 ? '' : 's'}
                </span>
              </div>
              <h3>{trackLessons[0]?.title || track}</h3>
              <p>{trackLessons[0]?.summary || ''}</p>
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
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
