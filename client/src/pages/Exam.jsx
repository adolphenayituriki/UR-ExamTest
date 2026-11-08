import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import QuestionRenderer from '../components/QuestionRenderer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useServerTimer } from '../hooks/useServerTimer.js';
import {
  formatDuration,
  initials,
  modeLabel,
  modeTone,
  pluralize,
} from '../utils/format.js';

export default function Exam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { student } = useAuth();

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [submitting, setSubmitting] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const [agreed, setAgreed] = useState(false);
  const [hints, setHints] = useState({});
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState('');
  const [integrityNotice, setIntegrityNotice] = useState('');

  useEffect(() => {
    if (session && session.status === 'in_progress') {
      setShowInstructions(true);
    }
  }, [session?.status]);

  useEffect(() => {
    if (!showInstructions) return;
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // Camera may be blocked, continue without
      }
    }
    startCam();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [showInstructions]);

  useEffect(() => {
    if (showInstructions || submitting) return;
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    const preventKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c','v','x','a','p','s','u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) || (e.ctrlKey && e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener('copy', prevent, true);
    document.addEventListener('cut', prevent, true);
    document.addEventListener('paste', prevent, true);
    document.addEventListener('contextmenu', prevent, true);
    document.addEventListener('keydown', preventKeys, true);
    return () => {
      document.removeEventListener('copy', prevent, true);
      document.removeEventListener('cut', prevent, true);
      document.removeEventListener('paste', prevent, true);
      document.removeEventListener('contextmenu', prevent, true);
      document.removeEventListener('keydown', preventKeys, true);
    };
  }, [showInstructions, submitting]);

  useEffect(() => {
    if (showInstructions || submitting) return;
    const onBlur = async () => {
      if (submissionRef.current) return;
      alert('Warning: Switching tabs/windows is not allowed during the exam. This will be recorded and may result in automatic submission.');
      if (submissionRef.current) return;
      submissionRef.current = true;
      setSubmitting(true);
      setShowSubmit(false);
      if (cameraStream) {
        try { cameraStream.getTracks().forEach(t => t.stop()); } catch {}
        setCameraStream(null);
      }
      try {
        await api.post(`/exams/${sessionId}/integrity`, { type: 'window_blur' });
      } catch {}
      api.post(`/exams/${sessionId}/submit`, { answers: Object.entries(answersRef.current).map(([instanceId, value]) => ({ instanceId, value })) }).catch(() => {});
      navigate(`/result/${sessionId}`, { replace: true });
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [showInstructions, submitting, sessionId, cameraStream, navigate]);

  const answersRef = useRef({});
  const sessionRef = useRef(null);
  const debounceRef = useRef(new Map());
  const pendingSaves = useRef(0);
  const submissionRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/exams/${sessionId}`);
        if (cancelled) return;
        const nextSession = response.data.session;
        if (nextSession.status !== 'in_progress') {
          navigate(`/result/${sessionId}`, { replace: true });
          return;
        }
        const initialAnswers = {};
        for (const answer of nextSession.answers || []) {
          initialAnswers[answer.instanceId] = answer.value;
        }
        answersRef.current = initialAnswers;
        setAnswers(initialAnswers);
        setCurrentIndex(
          Math.min(Math.max(0, nextSession.currentIndex || 0), nextSession.questions.length - 1)
        );
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

  const submitSession = useCallback(async () => {
    if (submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    setShowSubmit(false);
    if (cameraStream) {
      try { cameraStream.getTracks().forEach(t => t.stop()); } catch {}
      setCameraStream(null);
    }
    try {
      const payload = {
        answers: Object.entries(answersRef.current).map(([instanceId, value]) => ({
          instanceId,
          value,
        })),
      };
      api.post(`/exams/${sessionId}/submit`, payload).catch(() => {});
    } catch (err) {
      // ignore
    }
    navigate(`/result/${sessionId}`, { replace: true });
  }, [navigate, sessionId]);

  const handleTimeUp = useCallback(() => {
    setTimeUp(true);
    if (submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    setShowSubmit(false);
    if (cameraStream) {
      try { cameraStream.getTracks().forEach(t => t.stop()); } catch {}
      setCameraStream(null);
    }
    api.post(`/exams/${sessionId}/submit`, { answers: Object.entries(answersRef.current).map(([instanceId, value]) => ({ instanceId, value })) }).catch(() => {});
    navigate(`/result/${sessionId}`, { replace: true });
  }, [navigate, sessionId, cameraStream]);

  const remaining = useServerTimer({
    serverNow: session?.serverNow,
    endsAt: session?.endsAt,
    running: Boolean(session?.status === 'in_progress') && !submitting && !showInstructions,
    onExpire: handleTimeUp,
  });

  useEffect(() => {
    if (!session || session.status !== 'in_progress' || submitting || showInstructions) return undefined;
    const interval = window.setInterval(async () => {
      try {
        const response = await api.get(`/exams/${sessionId}/clock`);
        if (response.data.status !== 'in_progress') {
          navigate(`/result/${sessionId}`, { replace: true });
          return;
        }
        setSession((previous) =>
          previous
            ? {
                ...previous,
                serverNow: response.data.serverNow,
                endsAt: response.data.endsAt,
              }
            : previous
        );
      } catch {
        // The client-side countdown continues from the last server sync.
      }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [session?.status, sessionId, submitting, navigate, showInstructions]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress' || submitting) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [session?.status, submitting]);

  useEffect(() => {
    if (showInstructions || submitting) return;
    const handleVisibility = async () => {
      if (document.visibilityState !== 'hidden' || submissionRef.current) return;
      try {
        const response = await api.post(`/exams/${sessionId}/integrity`, {
          type: 'tab_hidden',
        });
        if (
          response.data.action === 'auto_submitted' ||
          response.data.action === 'already_submitted'
        ) {
          navigate(`/result/${sessionId}`, { replace: true });
          return;
        }
        if (response.data.action === 'flagged') {
          setIntegrityNotice(
            `Tab switch recorded. ${pluralize(
              response.data.remainingStrikes,
              'strike'
            )} remaining before automatic submission.`
          );
          setSession((previous) =>
            previous
              ? { ...previous, tabSwitchCount: response.data.tabSwitchCount }
              : previous
          );
        }
      } catch {
        // Integrity events are also enforced server-side on the next request.
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [showInstructions, submitting, sessionId, navigate]);

  useEffect(
    () => () => {
      for (const timer of debounceRef.current.values()) window.clearTimeout(timer);
      debounceRef.current.clear();
    },
    []
  );

  const saveAnswer = useCallback(
    async (instanceId, value, index) => {
      pendingSaves.current += 1;
      setSaveStatus('saving');
      let failed = false;
      try {
        await api.patch(`/exams/${sessionId}/answer`, {
          instanceId,
          value,
          currentIndex: index,
        });
      } catch (err) {
        const data = err.response?.data;
        if (data?.session || data?.expired) {
          navigate(`/result/${sessionId}`, { replace: true });
          return;
        }
        failed = true;
        setSaveStatus('error');
        setError(getErrorMessage(err));
      } finally {
        pendingSaves.current = Math.max(0, pendingSaves.current - 1);
        if (pendingSaves.current === 0) setSaveStatus(failed ? 'error' : 'saved');
      }
    },
    [navigate, sessionId]
  );

  function handleAnswerChange(value) {
    if (!session) return;
    const question = session.questions[currentIndex];
    if (!question) return;
    answersRef.current = { ...answersRef.current, [question.instanceId]: value };
    setAnswers((previous) => ({ ...previous, [question.instanceId]: value }));

    const timers = debounceRef.current;
    const existing = timers.get(question.instanceId);
    if (existing) window.clearTimeout(existing);
    timers.set(
      question.instanceId,
      window.setTimeout(() => {
        timers.delete(question.instanceId);
        saveAnswer(question.instanceId, value, currentIndex);
      }, 700)
    );
  }

  async function requestHint() {
    if (!session || hintLoading) return;
    const question = session.questions[currentIndex];
    if (!question) return;
    setHintError('');
    setHintLoading(true);
    const previous = hints[question.instanceId];
    const level = previous ? Math.min(2, previous.level + 1) : 0;
    try {
      const response = await api.post('/ai/hint', {
        sessionId,
        instanceId: question.instanceId,
        hintLevel: level,
      });
      setHints((current) => ({
        ...current,
        [question.instanceId]: {
          text: response.data.hint,
          level: response.data.hintLevel,
          source: response.data.source,
          remaining: response.data.hintsRemaining,
        },
      }));
      setSession((current) =>
        current ? { ...current, hintsUsed: response.data.hintsUsed } : current
      );
    } catch (err) {
      setHintError(getErrorMessage(err));
    } finally {
      setHintLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout wide>
        <div className="skeleton-block skeleton-exam-header" />
        <div className="exam-layout">
          <div className="skeleton-block skeleton-exam-side" />
          <div className="skeleton-block skeleton-exam-main" />
        </div>
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

  const course = session?.theme?.course;
  const assessment = session?.theme?.assessment;
  const questions = session?.questions || [];
  const question = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((value) => String(value).trim()).length;
  const unanswered = questions.length - answeredCount;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentHint = question ? hints[question.instanceId] : null;
  const timerTone = remaining <= 60 ? 'red' : remaining <= 300 ? 'amber' : 'blue';

  return (
    <Layout wide>
      {showInstructions && !submitting ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: '680px' }}>
            <span className="eyebrow">Exam Instructions</span>
            <h2>International Online Exam Guidelines</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Ensure a quiet, well-lit environment with no unauthorized materials.</li>
                  <li>Webcam must remain active throughout the exam.</li>
                  <li>Do not switch tabs, windows, or applications. Doing so may auto-submit the exam.</li>
                  <li>Copy, paste, cut, right-click, and developer tools are disabled.</li>
                  <li>Do not use external devices or communicate with others.</li>
                  <li>The exam is server-timed. Auto-submission occurs on timeout or violations.</li>
                  <li>All activity is monitored for integrity.</li>
                </ul>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <span>I have read and agree to follow all instructions</span>
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="side-label">Camera Preview</span>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '200px', height: '150px', borderRadius: '8px', background: '#000' }} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" disabled={!agreed} onClick={() => setShowInstructions(false)}>
                Start Exam
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {submitting ? (
        <div className="exam-blocker">
          <div className="exam-blocker-card">
            <span className="spinner" />
            <strong>Submitting...</strong>
          </div>
        </div>
      ) : null}

      <div className="exam-toolbar">
        <div className="exam-toolbar-main">
          <div className="exam-toolbar-title">
            <span className={`pill pill-${modeTone(session.mode)}`}>{modeLabel(session.mode)}</span>
            <div>
              <strong>
                {course?.code} · {course?.title}
              </strong>
              <span>{assessment?.title}</span>
            </div>
          </div>
          <div className="exam-toolbar-metrics">
            <div className="exam-progress">
              <span>
                {answeredCount}/{questions.length} answered
              </span>
              <div className="progress-track">
                <i style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className={`save-state save-${saveStatus}`}>
              {saveStatus === 'saving'
                ? 'Saving…'
                : saveStatus === 'error'
                  ? 'Save failed'
                  : saveStatus === 'saved'
                    ? 'All changes saved'
                    : 'Autosave ready'}
            </span>
          </div>
        </div>
          <div className="exam-toolbar-actions">
            <div className={`exam-timer timer-${timerTone}`}>
              <span>Server-timed</span>
              <strong>{showInstructions ? formatDuration(session?.durationSeconds || remaining) : formatDuration(remaining)}</strong>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSubmit(true)}
              disabled={submitting || showInstructions}
            >
              Submit exam
            </button>
          </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {integrityNotice ? <div className="alert alert-warning">{integrityNotice}</div> : null}

      <div className="exam-layout">
        <aside className="exam-sidebar">
          <div className="exam-student">
            <div className="avatar">{initials(student?.fullName)}</div>
            <div>
              <strong>{student?.fullName}</strong>
              <span>{student?.registrationNumber}</span>
            </div>
          </div>

          <div className="exam-side-block">
            <span className="side-label">Question palette</span>
            <div className="palette">
              {questions.map((item, index) => {
                const answered = String(answers[item.instanceId] || '').trim();
                return (
                  <button
                    type="button"
                    key={item.instanceId}
                    className={`palette-key ${answered ? 'palette-answered' : ''} ${
                      index === currentIndex ? 'palette-current' : ''
                    }`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="palette-legend">
              <span>
                <i className="legend-dot legend-answered" /> Answered
              </span>
              <span>
                <i className="legend-dot legend-unanswered" /> Unanswered
              </span>
            </div>
          </div>

          <div className="exam-side-block exam-integrity">
            <span className="side-label">Integrity monitor</span>
            <div className="integrity-line">
              <span className={`security-dot ${session.tabSwitchCount ? 'security-dot-warn' : ''}`} />
              <span>
                {showInstructions ? '0 tab switches recorded' : (session.tabSwitchCount
                  ? `${pluralize(session.tabSwitchCount, 'tab switch', 'tab switches')} recorded`
                  : 'No tab switches detected')}
              </span>
            </div>
            <p>
              Leaving this tab is reported to the server. After {session.maxTabSwitches} switches
              the session is auto-submitted.
            </p>
          </div>

          <div className="exam-side-block">
            <span className="side-label">Session details</span>
            <div className="side-detail">
              <span>Assessment</span>
              <strong>{assessment?.title}</strong>
            </div>
            <div className="side-detail">
              <span>Duration</span>
              <strong>{assessment?.durationMinutes} minutes</strong>
            </div>
            <div className="side-detail">
              <span>Pass mark</span>
              <strong>{assessment?.passMark}%</strong>
            </div>
            <div className="side-detail">
              <span>Total marks</span>
              <strong>{questions.reduce((sum, item) => sum + item.marks, 0)}</strong>
            </div>
          </div>
        </aside>

        <div className="exam-main">
          <div className="exam-question-head">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>{question?.marks} marks</span>
          </div>

          {question ? (
            <QuestionRenderer
              question={question}
              value={answers[question.instanceId] || ''}
              onChange={handleAnswerChange}
              disabled={submitting}
            />
          ) : null}

          {session.mode === 'practice' ? (
            <div className="hint-card">
              <div className="hint-head">
                <div>
                  <span className="eyebrow">Smart Socratic hint</span>
                  <h3>Stuck? Let the tutor guide your method.</h3>
                </div>
                <span className="pill pill-teal">
                  {currentHint
                    ? `Level ${currentHint.level + 1}`
                    : `${Math.max(0, 12 - (session.hintsUsed || 0))} hints left`}
                </span>
              </div>
              {currentHint ? (
                <div className="hint-body">
                  <p>{currentHint.text}</p>
                  <span className={`pill ${currentHint.source === 'llm' ? 'pill-teal' : 'pill-blue'}`}>
                    {currentHint.source === 'llm' ? 'LLM tutor' : 'Local Socratic engine'}
                  </span>
                </div>
              ) : (
                <p className="hint-placeholder">
                  Hints explain the method and next step. They never reveal the final answer.
                </p>
              )}
              {hintError ? <div className="alert alert-error compact">{hintError}</div> : null}
              <button
                type="button"
                className="btn btn-outline"
                onClick={requestHint}
                disabled={hintLoading || submitting}
              >
                {hintLoading
                  ? 'Generating hint…'
                  : currentHint
                    ? 'Ask for a deeper hint'
                    : 'Ask for a hint'}
              </button>
            </div>
          ) : (
            <div className="hint-locked">
              <span className="security-dot security-dot-warn" />
              <div>
                <strong>AI hints are disabled in this mode</strong>
                <span>{modeLabel(session.mode)} sessions simulate real assessment conditions.</span>
              </div>
            </div>
          )}

          <div className="exam-nav">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0 || submitting}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))
              }
              disabled={currentIndex >= questions.length - 1 || submitting}
            >
              Next question
            </button>
          </div>
        </div>
      </div>

      {showSubmit ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="submit-title">
            <span className="eyebrow">Confirm submission</span>
            <h2 id="submit-title">Submit this session for grading?</h2>
            <p>
              Once submitted, answers are locked and instantly marked against verified answer
              keys. The server will evaluate objective questions and AI-grade written responses.
            </p>
            <div className="modal-stats">
              <div>
                <span>Answered</span>
                <strong>{answeredCount}</strong>
              </div>
              <div>
                <span>Unanswered</span>
                <strong className={unanswered ? 'text-warn' : ''}>{unanswered}</strong>
              </div>
              <div>
                <span>Time remaining</span>
                <strong>{formatDuration(remaining)}</strong>
              </div>
            </div>
            {unanswered ? (
              <div className="alert alert-warning compact">
                {unanswered} question{unanswered === 1 ? '' : 's'} will receive zero marks.
              </div>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowSubmit(false)}
                disabled={submitting}
              >
                Keep working
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitSession}
                disabled={submitting}
              >
                Submit and grade
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
