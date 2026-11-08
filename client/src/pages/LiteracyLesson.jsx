import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import { formatMinutes, pluralize, toneForPercentage } from '../utils/format.js';

export default function LiteracyLesson() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [lessonResult, progressResult] = await Promise.allSettled([
          api.get(`/literacy/${slug}`),
          api.get('/literacy/progress'),
        ]);
        if (cancelled) return;
        if (lessonResult.status === 'fulfilled') setLesson(lessonResult.value.data.lesson);
        if (progressResult.status === 'fulfilled') {
          const byLesson = progressResult.value.data.progress || {};
          setProgress(byLesson[String(lessonResult.value.data.lesson?._id)] || null);
        }
        if (lessonResult.status === 'rejected') throw lessonResult.reason;
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
  }, [slug]);

  async function markComplete() {
    if (!lesson) return;
    setSaving(true);
    try {
      const response = await api.post(`/literacy/${slug}/progress`, {
        completed: true,
        quizScore: quizSubmitted ? quizScore : 0,
      });
      setProgress(response.data.progress);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const quiz = lesson?.quiz || [];
  const answeredCount = Object.values(quizAnswers).filter((v) => String(v).trim()).length;
  const quizScore = quizSubmitted
    ? quiz.reduce((sum, q) => {
        const given = String(quizAnswers[q.instanceId || q.key] || '').trim();
        const expected = String(q.correctAnswer || '').trim();
        return given === expected ? sum + 1 : sum;
      }, 0)
    : 0;
  const quizPct = quiz.length ? Math.round((quizScore / quiz.length) * 100) : 0;
  const done = progress?.completed;

  if (loading) {
    return (
      <Layout>
        <div className="skeleton-block skeleton-course-header" />
      </Layout>
    );
  }

  if (error && !lesson) {
    return (
      <Layout>
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/literacy')}>
          Back to lessons
        </button>
      </Layout>
    );
  }

  if (!lesson) return null;

  return (
    <Layout>
      <div className="result-top">
        <Link className="back-link" to="/literacy">
          <span aria-hidden="true">←</span> Lessons
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="result-hero">
        <div className="lesson-hero">
          <div className="lesson-hero-main">
            <span className={`pill pill-${toneForPercentage(50)}`}>{lesson.level}</span>
            <span className="pill pill-soft">{lesson.durationMinutes} min</span>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
            <div className="lesson-meta">
              <span>Track: {lesson.track}</span>
              <span>{pluralize(lesson.objectives.length, 'learning objective')}</span>
              <span>{done ? 'Completed' : 'Not started'}</span>
            </div>
          </div>
          <div className="lesson-hero-actions">
            {!done && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={markComplete}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Mark as complete'}
              </button>
            )}
            {done && (
              <button type="button" className="btn btn-ghost" disabled>
                Completed
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">What you will learn</span>
            <h2>Objectives</h2>
          </div>
        </div>
        <ul className="objective-list">
          {lesson.objectives.map((objective, index) => (
            <li key={index}>
              <span className="objective-chip">{index + 1}</span>
              {objective}
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Lesson content</span>
            <h2>Study material</h2>
          </div>
        </div>
        <div className="lesson-sections">
          {lesson.sections.map((section, index) => (
            <article className="lesson-section" key={index}>
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
              {section.tips.length ? (
                <div className="tips-list">
                  <span className="eyebrow">Tips</span>
                  <ul>
                    {section.tips.map((tip, ti) => (
                      <li key={ti}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="practice-task">
                <span className="eyebrow">Try it yourself</span>
                <p>{lesson.practiceTask}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {quiz.length ? (
        <section className="dashboard-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Knowledge check</span>
              <h2>Quiz</h2>
            </div>
            <span className="muted">
              {quizSubmitted ? `${quizScore}/${quiz.length} correct ({quizPct}%)` : `${answeredCount}/${quiz.length} answered`}
            </span>
          </div>
          <div className="quiz-list">
            {quiz.map((question, index) => (
              <article className="quiz-item" key={index}>
                <div className="quiz-question">
                  <strong>Q{index + 1}.</strong> {question.prompt}
                </div>
                <div className="quiz-options">
                  {question.options.map((option) => {
                    const selected = String(quizAnswers[question.key || index]) === String(option.key);
                    return (
                      <button
                        type="button"
                        key={option.key}
                        className={`quiz-option ${selected ? 'quiz-option-selected' : ''}`}
                        onClick={() =>
                          setQuizAnswers((previous) => ({
                            ...previous,
                            [question.key || index]: option.key,
                          }))
                        }
                      >
                        <span className="option-key">{option.key}</span>
                        <span className="option-text">{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          <div className="quiz-actions">
            {quizSubmitted ? (
              <>
                <ProgressRing
                  value={quizPct}
                  size={120}
                  stroke={10}
                  tone={quizPct >= 75 ? 'green' : quizPct >= 50 ? 'amber' : 'red'}
                  label={`${quizPct}%`}
                  caption={`${quizScore}/${quiz.length} correct`}
                />
                <div className="quiz-review">
                  {quiz.map((question, index) => {
                    const given = String(quizAnswers[question.key || index] || '').trim();
                    const expected = String(question.correctAnswer || '').trim();
                    const correct = given === expected;
                    return (
                      <div className="quiz-review-item" key={index}>
                        <span>
                          Q{index + 1} {correct ? '✓' : '✗'}
                        </span>
                        <span>
                          {question.prompt}
                          {correct ? null : ` — correct answer: ${expected}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setQuizSubmitted(false);
                    setQuizAnswers({});
                  }}
                >
                  Retake quiz
                </button>
                {!done && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setQuizSubmitted(true);
                      markComplete();
                    }}
                  >
                    Save score & complete lesson
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setQuizSubmitted(true)}
                disabled={answeredCount === 0}
              >
                Submit quiz
              </button>
            )}
          </div>
        </section>
      ) : null}

      {done ? (
        <div className="result-actions">
          <ProgressRing
            value={100}
            size={140}
            stroke={12}
            tone="green"
            label="Complete"
            caption="Lesson finished"
          />
          <Link className="btn btn-outline" to="/literacy">
            Back to lessons
          </Link>
        </div>
      ) : null}
    </Layout>
  );
}
