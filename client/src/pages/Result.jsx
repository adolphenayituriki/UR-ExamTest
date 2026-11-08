import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import {
  formatDate,
  modeLabel,
  modeTone,
  pluralize,
  toneForPercentage,
} from '../utils/format.js';

const TYPE_LABELS = {
  mcq: 'Multiple choice',
  truefalse: 'True / False',
  numeric: 'Numerical',
  short: 'Short answer',
  essay: 'Essay',
};

export default function Result() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/exams/${sessionId}`);
        if (cancelled) return;
        const nextSession = response.data.session;
        if (nextSession.status === 'in_progress') {
          navigate(`/exam/${sessionId}`, { replace: true });
          return;
        }
        setSession(nextSession);
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
  }, [sessionId, navigate]);

  async function retake() {
    if (!session) return;
    setStarting(true);
    setError('');
    try {
      const response = await api.post('/exams/start', {
        assessmentId: session.theme.assessment.id,
      });
      const next = response.data.session;
      navigate(
        next.status === 'in_progress' ? `/exam/${next.id}` : `/result/${next.id}`
      );
    } catch (err) {
      const activeId = err.response?.data?.details?.activeSessionId;
      if (err.response?.data?.code === 'ACTIVE_SESSION' && activeId) {
        navigate(`/exam/${activeId}`);
        return;
      }
      setError(getErrorMessage(err));
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="skeleton-block skeleton-result" />
      </Layout>
    );
  }

  if (error && !session) {
    return (
      <Layout>
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </button>
      </Layout>
    );
  }

  if (!session) return null;

  const result = session.result;
  const course = session.theme?.course;
  const assessment = session.theme?.assessment;
  const percentage = result?.percentage ?? 0;
  const essays = session.questions.filter((question) => question.type === 'essay');
  const topicRows = Object.values(result?.topicBreakdown || {}).sort(
    (a, b) => a.percentage - b.percentage
  );

  return (
    <Layout>
      <div className="result-top">
        <Link className="back-link" to="/dashboard">
          <span aria-hidden="true">←</span> Dashboard
        </Link>
        <Link className="back-link" to={`/courses/${course?.id}`}>
          Back to {course?.code}
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="result-hero">
        <div className="result-score">
          <ProgressRing
            value={percentage}
            size={168}
            stroke={14}
            tone={result?.passed ? 'green' : 'red'}
            label={`${percentage}%`}
            caption={`${result?.score}/${result?.maxScore} marks`}
          />
          <div className="result-score-copy">
            <span className="eyebrow">Assessment result</span>
            <h1>
              {result?.passed ? 'Passed' : 'Below pass mark'}
              <span className={`pill ${result?.passed ? 'pill-green' : 'pill-red'}`}>
                {result?.passed ? 'PASS' : 'REVISE'}
              </span>
            </h1>
            <p>
              {course?.code} · {course?.title}
            </p>
            <div className="result-meta">
              <span className={`pill pill-${modeTone(session.mode)}`}>{modeLabel(session.mode)}</span>
              <span className="pill pill-soft">{assessment?.title}</span>
              <span className="pill pill-soft">Pass mark {assessment?.passMark}%</span>
              <span className="pill pill-soft">
                Submitted {formatDate(result?.submittedAt, true)}
              </span>
            </div>
          </div>
        </div>

        <div className="result-aside">
          <div className="result-fact">
            <span>Questions</span>
            <strong>{pluralize(session.questions.length, 'question')}</strong>
          </div>
          <div className="result-fact">
            <span>Integrity flags</span>
            <strong className={session.tabSwitchCount ? 'text-warn' : ''}>
              {pluralize(session.tabSwitchCount || 0, 'tab switch', 'tab switches')}
            </strong>
          </div>
          <div className="result-fact">
            <span>Submission</span>
            <strong>{result?.autoSubmitted ? 'Automatic' : 'Manual'}</strong>
          </div>
          <div className="result-fact">
            <span>AI marker</span>
            <strong>{essays.length ? `${pluralize(essays.length, 'essay')} graded` : 'Not required'}</strong>
          </div>
        </div>
      </section>

      {result?.autoSubmitted || session.tabSwitchCount ? (
        <div className="alert alert-warning">
          <strong>Integrity notice.</strong>{' '}
          {result?.autoSubmitted
            ? 'This session was submitted automatically by the server or integrity monitor. '
            : ''}
          {session.tabSwitchCount
            ? `${pluralize(session.tabSwitchCount, 'tab switch', 'tab switches')} were recorded during the session and are attached to this result.`
            : ''}
        </div>
      ) : null}

      {essays.length ? (
        <div className="ai-note">
          <span className="ai-note-mark">AI</span>
          <div>
            <strong>Automated essay evaluation applied</strong>
            <span>
              Written answers were scored by semantic comparison against the verified marking
              scheme. Detailed marker feedback appears in each essay review below.
            </span>
          </div>
        </div>
      ) : null}

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Weakness map</span>
            <h2>Performance by syllabus topic</h2>
          </div>
          <Link className="text-link" to="/analytics">
            Open diagnostics
          </Link>
        </div>
        <div className="topic-results">
          {topicRows.map((topic) => (
            <div className="topic-result-row" key={topic.topic}>
              <div className="topic-result-head">
                <strong>{topic.title || topic.topic}</strong>
                <span>
                  {topic.awarded}/{topic.max} marks · {topic.percentage}%
                </span>
              </div>
              <div className="progress-track progress-track-lg">
                <i
                  className={`tone-${toneForPercentage(topic.percentage)}`}
                  style={{ width: `${Math.max(4, topic.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Question review</span>
            <h2>Verified answers and feedback</h2>
          </div>
          <span className="muted">Open any question to inspect the marking scheme</span>
        </div>

        <div className="review-list">
          {session.questions.map((question, index) => {
            const feedback = question.feedback;
            return (
              <details className="review-item" key={question.instanceId} open={index === 0}>
                <summary>
                  <span className="review-number">{index + 1}</span>
                  <span className="review-summary">
                    <strong>{question.topicTitle || question.topic}</strong>
                    <span>
                      {TYPE_LABELS[question.type]} · {feedback?.awarded ?? 0}/{question.marks} marks
                    </span>
                  </span>
                  <span className={`pill ${feedback?.correct ? 'pill-green' : 'pill-red'}`}>
                    {feedback?.correct ? 'Correct' : 'Needs work'}
                  </span>
                  {question.mutated ? <span className="pill pill-ai">Variant</span> : null}
                </summary>
                <div className="review-body">
                  <div className="review-block">
                    <span className="review-label">Question</span>
                    <p className="review-prompt">{question.prompt}</p>
                  </div>
                  <div className="review-grid">
                    <div className="review-block">
                      <span className="review-label">Your answer</span>
                      <p className={question.answer ? 'review-answer' : 'review-answer empty'}>
                        {question.answer || 'No answer submitted'}
                      </p>
                    </div>
                    <div className="review-block">
                      <span className="review-label">
                        {question.type === 'essay' ? 'Model answer / scheme' : 'Verified answer'}
                      </span>
                      <p className="review-answer review-correct">{question.correctAnswer}</p>
                    </div>
                  </div>
                  {question.explanation ? (
                    <div className="review-block">
                      <span className="review-label">Explanation</span>
                      <p>{question.explanation}</p>
                    </div>
                  ) : null}
                  {feedback?.aiFeedback ? (
                    <div className="review-block review-feedback">
                      <span className="review-label">
                        AI marker feedback
                        {feedback.aiScore !== undefined && feedback.aiScore !== null
                          ? ` · ${feedback.aiScore}%`
                          : ''}
                      </span>
                      <p>{feedback.aiFeedback}</p>
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <div className="result-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={retake}
          disabled={starting}
        >
          {starting ? 'Starting…' : `Retake ${modeLabel(session.mode)}`}
        </button>
        <Link className="btn btn-outline" to={`/courses/${course?.id}`}>
          Open module
        </Link>
        <Link className="btn btn-ghost" to="/analytics">
          See weakness diagnostics
        </Link>
      </div>
    </Layout>
  );
}
