export default function Logo({ size = 'md', light = false }) {
  return (
    <span className={`brand brand-${size} ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        <img src="/UR logo.png" alt="UR" />
      </span>
      <span className="brand-type">
        <span className="brand-name">ExamLab</span>
        <span className="brand-tag">University of Rwanda</span>
      </span>
    </span>
  );
}