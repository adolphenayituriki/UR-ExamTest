import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { formatDate, toneForPercentage, pluralize } from '../utils/format.js';

export default function PastPapers() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/past-papers');
        if (cancelled) return;
        setPapers(response.data.pastPapers || []);
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
  }, []);

  async function startPaper(paper) {
    setLoading(true);
    try {
      const response = await api.post(`/past-papers/${paper.slug}/start`);
      const session = response.data.session;
      navigate(`/exam/${session.id}`);
    } catch (err) {
      const activeId = err.response?.data?.details?.activeSessionId;
      if (err.response?.data?.code === 'ACTIVE_SESSION' && activeId) {
        navigate(`/exam/${activeId}`);
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="skeleton-block skeleton-course-header" />
        <div className="assessment-grid">
          {[0, 1, 2, 3].map((item) => (
            <div className="skeleton-block skeleton-assessment" key={item} />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">Past-paper library</span>
          <h1>Verified past papers with worked solutions</h1>
          <p className="page-lede">
            Organised past examination papers filtered to your department and year. Every paper
            carries a verified answer key and worked explanations.
          </p>
        </div>
        <Link className="btn btn-outline" to="/dashboard">
          Back to dashboard
        </Link>
      </div>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

      <div className="stat-grid stat-grid-four" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Papers available"
          value={papers.length}
          hint="Verified for your academic year"
          tone="blue"
        />
        <StatCard
          label="Your department"
          value="—"
          hint="Papers are filtered automatically"
          tone="teal"
        />
        <StatCard
          label="Answer keys"
          value="Verified"
          hint="Every question has a solution"
          tone="green"
        />
        <StatCard
          label="Offline ready"
          value="PWA"
          hint="Download and practise offline"
          tone="amber"
        />
      </div>

      <section className="dashboard-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Browse by module</span>
            <h2>Past papers for your year</h2>
          </div>
          <span className="muted">
            Papers are scoped to your registered programme and year of study.
          </span>
        </div>

        {papers.length ? (
          <div className="paper-grid">
            {papers.map((paper) => (
              <article className="paper-card" key={paper.slug}>
                <div className="paper-head">
                  <div>
                    <span className="paper-code">{paper.moduleCode}</span>
                    <span className="pill pill-soft">{paper.yearOfStudy} · {paper.semester}</span>
                  </div>
                  <span className={`pill ${toneForPercentage(75)}`}>Verified</span>
                </div>
                <h3>{paper.moduleTitle}</h3>
                <p className="paper-description">{paper.description}</p>
                <div className="paper-meta">
                  <span>
                    <strong>{paper.academicYear}</strong> · {paper.examSession}
                  </span>
                  <span>{paper.questionCount} questions</span>
                  <span>{paper.durationMinutes} min</span>
                </div>
                <div className="paper-topics">
                  {(paper.topics || []).slice(0, 5).map((topic) => (
                    <span className="topic-chip" key={topic}>
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="paper-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => startPaper(paper)}
                  >
                    Start practice
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            No past papers are published for your programme and year yet. Papers are added as
            lecturers verify and upload them.
          </div>
        )}
      </section>
    </Layout>
  );
}
