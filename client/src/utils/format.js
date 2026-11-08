export function initials(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatMinutes(minutes = 0) {
  const value = Math.round(Number(minutes) || 0);
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function modeLabel(mode) {
  return { practice: 'Practice', mock: 'Mock', exam: 'Final simulation' }[mode] || mode;
}

export function modeTone(mode) {
  return { practice: 'teal', mock: 'amber', exam: 'red' }[mode] || 'blue';
}

export function toneForPercentage(percentage = 0) {
  if (percentage >= 75) return 'green';
  if (percentage >= 50) return 'amber';
  return 'red';
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function pluralize(count, word, plural) {
  return `${count} ${count === 1 ? word : plural || `${word}s`}`;
}

export function wordCount(value = '') {
  return String(value).trim() ? String(value).trim().split(/\s+/).length : 0;
}
