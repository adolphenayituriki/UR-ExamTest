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
  const [semester, setSemester] = useState('2');

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

  return (
    <Layout>
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">Student dashboard</span>
          <h1>Welcome back, {student?.fullName?.split(' ')[0]}.</h1>
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
            <label className="avatar avatar-lg avatar-cycle" style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const img = document.createElement('img');
                  img.src = ev.target.result;
                  img.style.width = 'calc(100% - 6px)';
                  img.style.height = 'calc(100% - 6px)';
                  img.style.objectFit = 'cover';
                  img.style.borderRadius = '50%';
                  img.style.position = 'relative';
                  img.style.zIndex = '1';
                  const label = e.target.parentElement;
                  label.classList.add('avatar-cycle');
                  label.querySelectorAll('img,span').forEach(x=>x.remove());
                  label.appendChild(img);
                };
                reader.readAsDataURL(file);
              }} />
              <span>NA</span>
            </label>
            <div>
              <span className="profile-kicker">Verified UR profile</span>
              <h2>NAYITURIKI Adolphe</h2>
              <p>
                223452022 · BSc Software Engineering
              </p>
            </div>
          </div>
          <div className="profile-badges">
            <span className="pill pill-blue">Year 4</span>
            <span className="pill pill-soft">2025/2026</span>
            <span className="pill pill-teal">Kigali</span>
            <span className="pill pill-green">Enrollment active</span>
          </div>
          <dl className="profile-meta">
            <div>
              <dt>Student ID</dt>
              <dd>UR-223452022</dd>
            </div>
            <div>
              <dt>College</dt>
              <dd>College of Science and Technology</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>Software Engineering</dd>
            </div>
            <div>
              <dt>Institutional email</dt>
              <dd>adolphe.nayituriki@student.ur.ac.rw</dd>
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
            <div className="stat-grid" style={{ display: 'none' }}>
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

          <div className="weakness-panel" style={{ display: 'none' }}>
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
            <h2>Year {student?.yearOfStudy} · {student?.program}</h2>
          </div>
          <span className="muted">
            {(semester === '2' ? 3 : courses.length)} module{(semester === '2' ? 3 : courses.length) === 1 ? '' : 's'} mapped to your academic year
          </span>
        </div>

        {loading ? (
          <div className="course-grid">
            {[0, 1, 2].map((item) => (
              <div className="skeleton-block skeleton-course" key={item} />
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span className="muted">Select Semester</span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="select"
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div className="course-grid">
              {(semester === '2'
                ? [
                    {code:'CST3201', title:'Software Engineering', credits:4, description:'Software development lifecycle and methodologies'},
                    {code:'CST3202', title:'Web Technologies', credits:4, description:'Modern web development with frameworks'},
                    {code:'CST3203', title:'Mobile Application Development', credits:4, description:'Cross-platform mobile app development'},
                  ]
                : courses
              ).map((m, i) => (
                <article className="course-card" key={m.id || 'mock-'+i}>
                  <div className="course-stripe" />
                  <div className="course-top">
                    <span className="course-code">{m.code}</span>
                    <span className="pill pill-soft">{m.credits || 4} credits</span>
                  </div>
                  <h3>{m.title}</h3>
                  <p className="course-description">{m.description || m.desc}</p>
                  <div className="course-topics">
                    {(m.topics || []).slice(0,4).map((t) => (
                      <span className="topic-chip" key={t.key || t.title || t}>{t.title || t}</span>
                    ))}
                    {!(m.topics && m.topics.length) && (<><span className="topic-chip">Core</span><span className="topic-chip">Theory</span><span className="topic-chip">Lab</span></>)}
                  </div>
                  <div className="course-metrics">
                    <div>
                      <span>Questions</span>
                      <strong>{m.questionCount || 50}</strong>
                    </div>
                    <div>
                      <span>Attempts</span>
                      <strong>{m.attempts || 0}</strong>
                    </div>
                    <div>
                      <span>Best</span>
                      <strong>{m.best || 0}%</strong>
                    </div>
                  </div>
                  <div className="course-actions">
                    <button type="button" className="btn btn-outline" onClick={() => {
                      const exam = (m.id ? courses.find(c=>c.id===m.id)?.assessments?.find(a=>a.mode==='exam') : null) || courses[0]?.assessments?.find(a=>a.mode==='exam');
                      if (exam && exam.id) startAssessment(exam);
                      else navigate('/courses/1');
                    }}>Exam Test</button>
                    <button type="button" className="btn btn-primary" onClick={() => {
                      const practice = courses.find(c=>c.id===m.id)?.assessments?.find(a=>a.mode==='practice') || courses[0]?.assessments?.find(a=>a.mode==='practice');
                      if (practice && practice.id) {
                        startAssessment(practice);
                        return;
                      }
                      navigate('/courses/1');
                    }} disabled={Boolean(starting)}>{starting ? 'Starting…' : 'Quick practice'}</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-section" style={{ display: 'none' }}>
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
        ) : null}
      </section>
    </Layout>
  );
}
