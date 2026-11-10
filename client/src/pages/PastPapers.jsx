import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { toneForPercentage } from '../utils/format.js';

export default function PastPapers() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const { toast } = useToast();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState(new Set());

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

  // Derived filter options
  const modules = useMemo(() => {
    const seen = new Set();
    return papers
      .filter((p) => !seen.has(p.moduleCode) && seen.add(p.moduleCode))
      .map((p) => ({ code: p.moduleCode, title: p.moduleTitle }));
  }, [papers]);

  const years = useMemo(() => {
    const seen = new Set();
    return papers
      .filter((p) => !seen.has(p.yearOfStudy) && seen.add(p.yearOfStudy))
      .map((p) => p.yearOfStudy)
      .sort((a, b) => a - b);
  }, [papers]);

  const semesters = useMemo(() => {
    const seen = new Set();
    return papers
      .filter((p) => !seen.has(p.semester) && seen.add(p.semester))
      .map((p) => p.semester);
  }, [papers]);

  const allTopics = useMemo(() => {
    const seen = new Set();
    papers.forEach((p) => (p.topics || []).forEach((t) => seen.add(t)));
    return Array.from(seen).sort();
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const matchesSearch =
        !searchQuery ||
        paper.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.moduleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (paper.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (paper.topics || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesModule = selectedModule === 'all' || paper.moduleCode === selectedModule;
      const matchesYear = selectedYear === 'all' || paper.yearOfStudy === selectedYear;
      const matchesSemester = selectedSemester === 'all' || paper.semester === selectedSemester;
      const matchesTopics =
        selectedTopics.size === 0 ||
        (paper.topics || []).some((t) => selectedTopics.has(t));

      return matchesSearch && matchesModule && matchesYear && matchesSemester && matchesTopics;
    });
  }, [papers, searchQuery, selectedModule, selectedYear, selectedSemester, selectedTopics]);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedModule !== 'all') count++;
    if (selectedYear !== 'all') count++;
    if (selectedSemester !== 'all') count++;
    if (selectedTopics.size > 0) count++;
    return count;
  }, [searchQuery, selectedModule, selectedYear, selectedSemester, selectedTopics]);

  function clearFilters() {
    setSearchQuery('');
    setSelectedModule('all');
    setSelectedYear('all');
    setSelectedSemester('all');
    setSelectedTopics(new Set());
  }

  async function startPaper(paper) {
    setError('');
    setStarting(paper.slug);
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
      setStarting('');
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
          value={student?.department || student?.program || '—'}
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
          label="Any device"
          value="Responsive"
          hint="Works on phones and laptops"
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

        {/* Filters */}
        <div className="paper-filters" style={{ marginBottom: '1.5rem' }}>
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="pp-search" className="filter-label">
                Search
              </label>
              <input
                id="pp-search"
                type="search"
                className="filter-input"
                placeholder="Module, topic, description…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search past papers"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="pp-module" className="filter-label">
                Module
              </label>
              <select
                id="pp-module"
                className="filter-select"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                aria-label="Filter by module"
              >
                <option value="all">All modules</option>
                {modules.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="pp-year" className="filter-label">
                Year
              </label>
              <select
                id="pp-year"
                className="filter-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="Filter by year"
              >
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="pp-semester" className="filter-label">
                Semester
              </label>
              <select
                id="pp-semester"
                className="filter-select"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                aria-label="Filter by semester"
              >
                <option value="all">All semesters</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group filter-group-topics">
              <label htmlFor="pp-topics" className="filter-label">
                Topics ({selectedTopics.size})
              </label>
              <select
                id="pp-topics"
                className="filter-select"
                multiple
                value={Array.from(selectedTopics)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setSelectedTopics(new Set(values));
                }}
                aria-label="Filter by topics"
              >
                {allTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {activeFilters > 0 && (
              <div className="filter-group filter-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {activeFilters > 0 && (
            <div className="active-filter-chips">
              {searchQuery && (
                <span className="filter-chip" onClick={() => setSearchQuery('')}>
                  Search: &ldquo;{searchQuery}&rdquo;
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              )}
              {selectedModule !== 'all' && (
                <span className="filter-chip" onClick={() => setSelectedModule('all')}>
                  Module: {modules.find((m) => m.code === selectedModule)?.title || selectedModule}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="filter-chip" onClick={() => setSelectedYear('all')}>
                  Year: {selectedYear}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              )}
              {selectedSemester !== 'all' && (
                <span className="filter-chip" onClick={() => setSelectedSemester('all')}>
                  Semester: {selectedSemester}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              )}
              {Array.from(selectedTopics).map((t) => (
                <span className="filter-chip" key={t} onClick={() => setSelectedTopics((prev) => { const n = new Set(prev); n.delete(t); return n; })}>
                  Topic: {t}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="filter-summary" style={{ marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
          Showing <strong>{filteredPapers.length}</strong> of <strong>{papers.length}</strong> papers
          {activeFilters > 0 && <span> ({activeFilters} filter{activeFilters > 1 ? 's' : ''} active)</span>}
        </div>

        {filteredPapers.length ? (
          <div className="paper-grid">
            {filteredPapers.map((paper) => (
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
                    <span
                      className={`topic-chip ${selectedTopics.has(topic) ? 'topic-chip-selected' : ''}`}
                      key={topic}
                      onClick={() => setSelectedTopics((prev) => {
                        const n = new Set(prev);
                        if (n.has(topic)) n.delete(topic);
                        else n.add(topic);
                        return n;
                      })}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="paper-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => startPaper(paper)}
                    disabled={Boolean(starting)}
                  >
                    {starting === paper.slug ? 'Starting…' : 'Start practice'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            {papers.length
              ? 'No papers match the current filters. Try adjusting your search or filters.'
              : 'No past papers are published for your programme and year yet. Papers are added as lecturers verify and upload them.'}
          </div>
        )}
      </section>
    </Layout>
  );
}
