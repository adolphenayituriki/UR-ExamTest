import { wordCount } from '../utils/format.js';

const TYPE_LABELS = {
  mcq: 'Multiple choice',
  truefalse: 'True / False',
  numeric: 'Numerical',
  short: 'Short answer',
  essay: 'Essay',
};

export default function QuestionRenderer({ question, value = '', onChange, disabled = false }) {
  const words = wordCount(value);
  const isText = question.type === 'short' || question.type === 'essay';

  const options =
    question.type === 'truefalse' && !question.options?.length
      ? [
          { key: 'true', text: 'True' },
          { key: 'false', text: 'False' },
        ]
      : question.options || [];

  return (
    <div className="question-block">
      <div className="question-meta">
        <span className="chip chip-topic">{question.topicTitle || question.topic}</span>
        <span className={`chip chip-type type-${question.type}`}>{TYPE_LABELS[question.type]}</span>
        <span className="chip chip-marks">{question.marks} marks</span>
        {question.mutated ? <span className="chip chip-ai">Dynamic variant</span> : null}
        {question.difficulty ? (
          <span className={`chip chip-difficulty ${question.difficulty}`}>{question.difficulty}</span>
        ) : null}
      </div>

      <h2 className="question-prompt">{question.prompt}</h2>

      {question.type === 'mcq' || question.type === 'truefalse' ? (
        <div className={question.type === 'truefalse' ? 'option-list option-list-compact' : 'option-list'}>
          {options.map((option) => {
            const selected = String(value) === String(option.key);
            return (
              <button
                type="button"
                key={option.key}
                className={`option ${selected ? 'option-selected' : ''}`}
                onClick={() => onChange(option.key)}
                disabled={disabled}
                aria-pressed={selected}
              >
                <span className="option-key">{option.key}</span>
                <span className="option-text">{option.text}</span>
                <span className="option-mark" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}

      {question.type === 'numeric' ? (
        <div className="numeric-answer">
          <label className="field-label" htmlFor={`answer-${question.instanceId}`}>
            Your answer
          </label>
          <input
            id={`answer-${question.instanceId}`}
            className="input input-answer"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            placeholder="Enter a numerical value"
            autoComplete="off"
          />
          <p className="field-hint">Include only the numerical value unless the question asks for units.</p>
        </div>
      ) : null}

      {isText ? (
        <div className="text-answer">
          <label className="field-label" htmlFor={`answer-${question.instanceId}`}>
            Your answer
          </label>
          <textarea
            id={`answer-${question.instanceId}`}
            className="input textarea-answer"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            rows={question.type === 'essay' ? 12 : 6}
            placeholder={
              question.type === 'essay'
                ? 'Structure your answer: introduction, developed arguments with examples, and a conclusion.'
                : 'Write a focused answer using precise subject terminology.'
            }
          />
          <div className="textarea-footer">
            <span className={`word-count ${words < 40 ? 'word-count-low' : ''}`}>
              {words} {words === 1 ? 'word' : 'words'}
            </span>
            <span className="field-hint">
              {question.type === 'essay'
                ? 'Your essay is evaluated against the verified marking scheme by the AI marker.'
                : 'The marker checks key concepts and completeness.'}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
