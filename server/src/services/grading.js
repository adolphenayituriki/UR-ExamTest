const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(value = '') {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ').length : 0;
}

export function keywordCoverage(text, keywords = []) {
  const normalized = ` ${normalizeText(text)} `;
  if (!keywords.length) return 0;
  const matched = keywords.filter((keyword) => {
    const needle = normalizeText(keyword);
    return needle && normalized.includes(needle);
  });
  return {
    matched,
    missing: keywords.filter((keyword) => !matched.includes(keyword)),
    ratio: matched.length / keywords.length,
  };
}

export function gradeObjective(instance, value) {
  const expected = String(instance.correctAnswer ?? '').trim().toLowerCase();
  const given = String(value ?? '').trim().toLowerCase();
  const correct = expected !== '' && given === expected;
  return {
    correct,
    awarded: correct ? instance.marks : 0,
    feedback: correct
      ? 'Correct.'
      : `Expected answer: ${instance.correctAnswer}.`,
  };
}

export function gradeNumeric(instance, value) {
  const expected = Number(instance.correctAnswer);
  const given = Number(String(value).replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(given) || !Number.isFinite(expected)) {
    return { correct: false, awarded: 0, feedback: `Expected answer: ${instance.correctAnswer}.` };
  }
  const tolerance = Math.max(0.02, Math.abs(expected) * 0.02);
  const correct = Math.abs(given - expected) <= tolerance;
  return {
    correct,
    awarded: correct ? instance.marks : 0,
    feedback: correct ? 'Correct.' : `Expected answer: ${instance.correctAnswer}.`,
  };
}

export function gradeShort(instance, value) {
  const rubric = instance.rubric || {};
  const { matched, missing, ratio } = keywordCoverage(value, rubric.keywords || []);
  const words = countWords(value);
  const minWords = rubric.minWords || 20;
  if (words === 0) {
    return {
      correct: false,
      awarded: 0,
      feedback: 'No answer submitted.',
      matched,
      missing,
    };
  }
  const lengthScore = clamp(words / minWords);
  const score = clamp(ratio * 0.7 + lengthScore * 0.3);
  const awarded = Math.round(score * instance.marks * 10) / 10;
  const parts = [];
  if (matched.length) parts.push(`Covered: ${matched.join(', ')}.`);
  if (missing.length) parts.push(`Develop further: ${missing.join(', ')}.`);
  if (words < minWords) parts.push(`Aim for at least ${minWords} words for a complete answer.`);
  return {
    correct: score >= 0.5,
    awarded,
    feedback: parts.join(' ') || 'Answer recorded.',
    score,
    matched,
    missing,
  };
}
