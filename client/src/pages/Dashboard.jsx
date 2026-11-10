import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  formatDate,
  formatDuration,
  formatMinutes,
  initials,
  modeLabel,
  modeTone,
  toneForPercentage,
} from '../utils/format.js';

const SEMESTER_OPTIONS = [
  { value: 'all', label: 'All semesters' },
  { value: 'I', label: 'Semester 1' },
  { value: 'II', label: 'Semester 2' },
];

export default function Dashboard() {
  const { student } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [activeExpired, setActiveExpired] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState('');
  const [semester, setSemester] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      const results = await Promise.allSettled([
        api.get('/courses'),
        api.get('/analytics/overview'),
        api.get('/exams/active'),
        api.get('/ai/status'),
      ]);
      if (cancelled) return;

      const [coursesResult, overviewResult, activeResult, aiResult] = results;
      if (coursesResult.status === 'fulfilled') setCourses(coursesResult.value.data.courses || []);
      if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value.data);
      if (activeResult.status === 'fulfilled') {
        setActiveSession(activeResult.value.data.session || null);
        setActiveExpired(Boolean(activeResult.value.data.expired));
      }
      if (aiResult.status === 'fulfilled') setAiStatus(aiResult.value.data);

      const firstFailure = results.find((result) => result.status === 'rejected');
      if (firstFailure) setError(getErrorMessage(firstFailure.reason));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function startAssessment(assessment) {
    if (!assessment?.id) return;
    setError('');
    setStarting(assessment.id);
    try {
      const response = await api.post('/exams/start', { assessmentId: assessment.id });
      const session = response.data.session;
      if (session.status === 'in_progress') {
        navigate(`/exam/${session.id}`);
      } else {
        navigate(`/result/${session.id}`);
      }
    } catch (err) {
      const code = err.response?.data?.code;
      const activeId = err.response?.data?.details?.activeSessionId;
      if (code === 'ACTIVE_SESSION' && activeId) {
        navigate(`/exam/${activeId}`);
        return;
      }
      setError(getErrorMessage(err));
      setStarting('');
    }
  }

  const stats = overview?.stats;
  const weakTopics = overview?.weakTopics || [];
  const recentAttempts = overview?.recentAttempts || [];
  const visibleCourses = courses.filter(
    (course) => semester === 'all' || course.semester === semester || course.semester === 'Annual'
  );

  return (
    <Layout>
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">Student dashboard</span>
          <h1>Welcome back, {student?.fullName?.split(' ')[0] || 'Student'}.</h1>
          <p className="page-lede">
            Your registered modules, live sessions and diagnostic signals in one place.
          </p>
        </div>
        <span className={`pill ${aiStatus?.engine === 'llm' ? 'pill-teal' : 'pill-blue'}`}>
          {aiStatus?.engine === 'llm'
            ? `LLM engine · ${aiStatus.model}`
            : 'Local Socratic engine active'}
        </span>
      </div>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      {activeSession ? (
        <div className={`resume-banner ${activeExpired ? 'resume-expired' : ''}`}>
          <div>
            <span className="resume-kicker">
              {activeExpired ? 'Session auto-submitted' : 'Unfinished server-timed session'}
            </span>
            <strong>
              {activeSession.theme?.course?.code} · {activeSession.theme?.assessment?.title}
            </strong>
            <span>
              {activeExpired
                ? 'The server clock reached zero and your answers were graded automatically.'
                : `${activeSession.answeredCount} of ${activeSession.totalQuestions} answered · ${formatDuration(
                    activeSession.remainingSeconds
                  )} remaining`}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate(
                activeExpired
                  ? `/result/${activeSession.id}`
                  : `/exam/${activeSession.id}`
              )
            }
          >
            {activeExpired ? 'View result' : 'Resume session'}
          </button>
        </div>
      ) : null}

      <section className="dashboard-hero">
        <article className="profile-card">
          <div className="profile-top">
            <div className="avatar avatar-lg" aria-hidden="true">
              <span>{initials(student?.fullName || '') || 'UR'}</span>
            </div>
            <div>
              <span className="profile-kicker">Verified UR profile</span>
              <h2>{student?.fullName || 'UR Student'}</h2>
              <p>
                {student?.registrationNumber || '—'} · {student?.program || '—'}
              </p>
            </div>
          </div>
          <div className="profile-badges">
            <span className="pill pill-blue">Year {student?.yearOfStudy || '—'}</span>
            <span className="pill pill-soft">{student?.academicYear || '—'}</span>
            <span className="pill pill-teal">{student?.campus || '—'}</span>
            <span className={`pill ${student?.enrollmentStatus === 'active' ? 'pill-green' : 'pill-red'}`}>
              {student?.enrollmentStatus === 'active' ? 'Enrollment active' : 'Enrollment inactive'}
            </span>
          </div>
          <dl className="profile-meta">
            <div>
              <dt>Student ID</dt>
              <dd>{student?.studentId || '—'}</dd>
            </div>
            <div>
              <dt>College</dt>
              <dd>{student?.college || '—'}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{student?.department || '—'}</dd>
            </div>
            <div>
              <dt>Institutional email</dt>
              <dd>{student?.email || '—'}</dd>
            </div>
          </dl>
          <div className="profile-security">
            <span className="security-dot" />
            <div>
              <strong>Single-session lock enabled</strong>
              <span>A new sign-in locks every other active session for this registration number.</span>
            </div>
          </div>
        </article>

        <div className="summary-panel">
          {loading ? (
            <div className="skeleton-block skeleton-stats" />
          ) : (
            <div className="stat-grid">
              <StatCard
                label="Attempts"
                value={stats?.attempts ?? 0}
                hint="Graded sessions"
                tone="blue"
              />
              <StatCard
                label="Average score"
                value={`${stats?.averagePercentage ?? 0}%`}
                hint="Across all graded work"
                tone={toneForPercentage(stats?.averagePercentage)}
              />
              <StatCard
                label="Best result"
                value={`${stats?.bestPercentage ?? 0}%`}
                hint="Personal record"
                tone="teal"
              />
              <StatCard
                label="Pass rate"
                value={`${stats?.passRate ?? 0}%`}
                hint="Assessments at or above pass mark"
                tone="green"
              />
              <StatCard
                label="Study time"
                value={formatMinutes(stats?.studyMinutes ?? 0)}
                hint="Time spent under exam conditions"
                tone="amber"
              />
            </div>
          )}

          <div className="weakness-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">AI weakness diagnostics</span>
                <h3>Top revision priorities</h3>
              </div>
              <Link className="text-link" to="/analytics">
                Full diagnostic
              </Link>
            </div>
            {loading ? (
              <div className="skeleton-block skeleton-lines" />
            ) : weakTopics.length ? (
              <div className="weakness-list">
                {weakTopics.map((topic) => (
                  <div className="weakness-row" key={topic.key}>
                    <div className="weakness-info">
                      <strong>{topic.title}</strong>
                      <span>
                        {topic.courseCode} · {topic.questions} questions analysed
                      </span>
                    </div>
                    <div className="mini-bar">
                      <i
                        className={`mini-bar-fill tone-${toneForPercentage(topic.percentage)}`}
                        style={{ width: `${Math.max(4, topic.percentage)}%` }}
                      />
                    </div>
                    <span className="weakness-score">{topic.percentage}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline">
                No significant weakness pattern yet. Complete more practice questions so the
                diagnostic engine can map your syllabus coverage.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Registered modules</span>
            <h2>
              Year {student?.yearOfStudy || '—'} · {student?.program || '—'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="muted">
              {visibleCourses.length} module{visibleCourses.length === 1 ? '' : 's'} available
            </span>
            <select
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              className="select"
              aria-label="Filter modules by semester"
            >
              {SEMESTER_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="course-grid">
            {[0, 1, 2].map((item) => (
              <div className="skeleton-block skeleton-course" key={item} />
            ))}
          </div>
        ) : visibleCourses.length ? (
          <div className="course-grid">
            {visibleCourses.map((course) => {
              const practice = course.assessments?.find((assessment) => assessment.mode === 'practice');
              const finalExam = course.assessments?.find((assessment) => assessment.mode === 'exam');
              return (
                <article className="course-card" key={course.id}>
                  <div className="course-stripe" style={{ background: course.accent || undefined }} />
                  <div className="course-top">
                    <span className="course-code">{course.code}</span>
                    <span className="pill pill-soft">{course.credits} credits</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <div className="course-topics">
                    {(course.topics || []).slice(0, 4).map((topic) => (
                      <span className="topic-chip" key={topic.key}>
                        {topic.title}
                      </span>
                    ))}
                  </div>
                  <div className="course-metrics">
                    <div>
                      <span>Questions</span>
                      <strong>{course.questionCount || 0}</strong>
                    </div>
                    <div>
                      <span>Attempts</span>
                      <strong>{course.attempts || 0}</strong>
                    </div>
                    <div>
                      <span>Best</span>
                      <strong>{course.best || 0}%</strong>
                    </div>
                  </div>
                  <div className="course-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() =>
                        finalExam
                          ? startAssessment(finalExam)
                          : navigate(`/courses/${course.id}`)
                      }
                      disabled={Boolean(starting)}
                    >
                      Exam test
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        practice
                          ? startAssessment(practice)
                          : navigate(`/courses/${course.id}`)
                      }
                      disabled={Boolean(starting)}
                    >
                      {starting === practice?.id ? 'Starting…' : 'Quick practice'}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-block"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    Open module details
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-inline">
            No modules are mapped to this semester for your academic year.
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Assessment history</span>
            <h2>Recent graded sessions</h2>
          </div>
          <Link className="text-link" to="/analytics">
            View analytics
          </Link>
        </div>

        {loading ? (
          <div className="skeleton-block skeleton-table" />
        ) : recentAttempts.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Assessment</th>
                  <th>Mode</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Submitted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>
                      <strong>{attempt.courseCode}</strong>
                      <span className="cell-sub">{attempt.courseTitle}</span>
                    </td>
                    <td>{attempt.assessmentTitle}</td>
                    <td>
                      <span className={`pill pill-${modeTone(attempt.mode)}`}>
                        {modeLabel(attempt.mode)}
                      </span>
                    </td>
                    <td>
                      <strong>{attempt.percentage}%</strong>
                      <span className="cell-sub">
                        {attempt.score}/{attempt.maxScore}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${attempt.passed ? 'pill-green' : 'pill-red'}`}>
                        {attempt.passed ? 'Passed' : 'Below pass'}
                      </span>
                    </td>
                    <td>
                      {formatDate(attempt.submittedAt, true)}
                      {attempt.autoSubmitted ? (
                        <span className="cell-sub cell-warn">Auto-submitted</span>
                      ) : null}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/result/${attempt.id}`)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-inline">
            No graded sessions yet. Start a practice track to establish your baseline.
          </div>
        )}
      </section>
    </Layout>
  );
}
