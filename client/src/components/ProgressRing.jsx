export default function ProgressRing({
  value = 0,
  size = 132,
  stroke = 12,
  tone = 'blue',
  label,
  caption,
}) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (safe / 100) * circumference;
  const center = size / 2;

  return (
    <div className={`ring ring-${tone}`} style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${safe}%`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="ring-track"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="ring-value"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />
      </svg>
      <div className="ring-center">
        <strong>{label ?? `${Math.round(safe)}%`}</strong>
        {caption ? <span>{caption}</span> : null}
      </div>
    </div>
  );
}
