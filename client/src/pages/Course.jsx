import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import {
  formatDate,
  modeLabel,
  modeTone,
  pluralize,
  toneForPercentage,
} from '../utils/format.js';

export default function Course() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/courses/${courseId}`);
        if (cancelled) return;
        setCourse(response.data.course);
        setAssessments(response.data.assessments || []);
        setHistory(response.data.history || []);
        setStats(response.data.stats || null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  async function startAssessment(assessment) {
    const assessmentId = assessment.id || assessment._id;
    setError('');
    setStarting(assessmentId);
    try {
      const response = await api.post('/exams/start', { assessmentId });
      const session = response.data.session;
      navigate(
        session.status === 'in_progress' ? `/exam/${session.id}` : `/result/${session.id}`
      );
    } catch (err) {
      const activeId = err.response?.data?.details?.activeSessionId;
      if (err.response?.data?.code === 'ACTIVE_SESSION' && activeId) {
        navigate(`/exam/${activeId}`);
        return;
      }
      setError(getErrorMessage(err));
      setStarting('');
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="skeleton-block skeleton-course-header" />
        <div className="assessment-grid">
          {[0, 1, 2].map((item) => (
            <div className="skeleton-block skeleton-assessment" key={item} />
          ))}
        </div>
      </Layout>
    );
  }

  if (error && !course) {
    return (
      <Layout>
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </button>
      </Layout>
    );
  }

  return (
    <Layout>
      <button type="button" className="back-link" onClick={() => navigate('/dashboard')}>
        <span aria-hidden="true">←</span> Dashboard
      </button>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="course-hero">
        <div className="course-hero-main">
          <span className="course-hero-code">{course.code}</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-hero-meta">
            <span className="pill pill-soft">{course.program}</span>
            <span className="pill pill-soft">Year {course.yearOfStudy}</span>
            <span className="pill pill-soft">Semester {course.semester}</span>
            <span className="pill pill-soft">{course.credits} credits</span>
          </div>
        </div>
        <div className="course-hero-stats">
          <div>
            <span>Attempts</span>
            <strong>{stats?.attempts ?? 0}</strong>
          </div>
          <div>
            <span>Average</span>
            <strong>{stats?.average ?? 0}%</strong>
          </div>
          <div>
            <span>Best</span>
            <strong>{stats?.best ?? 0}%</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Assessment variants</span>
            <h2>Launch a session</h2>
          </div>
          <span className="muted">Server-timed · auto-graded</span>
        </div>

        <div className="assessment-grid">
          {assessments.map((assessment) => (
            <article className={`assessment-card assessment-${assessment.mode}`} key={assessment._id}>
              <div className="assessment-head">
                <span className={`pill pill-${modeTone(assessment.mode)}`}>
                  {modeLabel(assessment.mode)}
                </span>
                <span className="assessment-duration">{assessment.durationMinutes} min</span>
              </div>
              <h3>{assessment.title}</h3>
              <p>{assessment.description}</p>
              <ul className="assessment-facts">
                <li>{pluralize(assessment.questionCount, 'question')}</li>
                <li>Pass mark {assessment.passMark}%</li>
                <li>{assessment.hintsAllowed ? 'AI hints enabled' : 'Hints disabled'}</li>
                <li>{assessment.mode === 'practice' ? 'Guided learning' : 'Integrity monitored'}</li>
              </ul>
              <button
                type="button"
                className={`btn ${assessment.mode === 'practice' ? 'btn-primary' : 'btn-outline'} btn-block`}
                onClick={() => startAssessment(assessment)}
                disabled={Boolean(starting)}
              >
                {starting === assessment._id ? 'Starting secure session…' : `Start ${modeLabel(assessment.mode)}`}
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="two-column">
        <section className="dashboard-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Syllabus map</span>
              <h2>Topics in this module</h2>
            </div>
          </div>
          <div className="topic-table">
            {course.topics.map((topic) => (
              <div className="topic-row" key={topic.key}>
                <div>
                  <strong>{topic.title}</strong>
                  <span>{topic.key}</span>
                </div>
                <span className="topic-count">{pluralize(topic.questionCount, 'question')}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Attempt history</span>
              <h2>Your sessions</h2>
            </div>
          </div>
          {history.length ? (
            <div className="history-list">
              {history.map((attempt) => (
                <button
                  type="button"
                  className="history-row"
                  key={attempt.id}
                  onClick={() =>
                    navigate(
                      attempt.status === 'in_progress'
                        ? `/exam/${attempt.id}`
                        : `/result/${attempt.id}`
                    )
                  }
                >
                  <div className="history-main">
                    <strong>{attempt.assessmentTitle}</strong>
                    <span>
                      {formatDate(attempt.submittedAt || attempt.startedAt, true)} ·{' '}
                      {modeLabel(attempt.mode)}
                    </span>
                  </div>
                  {attempt.status === 'in_progress' ? (
                    <span className="pill pill-amber">In progress</span>
                  ) : (
                    <span className={`score-chip tone-${toneForPercentage(attempt.percentage)}`}>
                      {attempt.percentage}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              No attempts for this module yet. Start with the practice track to build a baseline.
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
