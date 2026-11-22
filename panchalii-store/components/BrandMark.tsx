import { useId } from 'react';

// Monogram + wordmark in one SVG so the entry logo can scale exactly onto the header logo.
function Shapes({ fill }: { fill: string }) {
  const dots = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
  return (
    <g fill={fill}>
      <g transform="translate(150 70) scale(0.62) translate(-100 -100)">
        <circle cx="100" cy="100" r="72" fill="none" stroke={fill} strokeWidth="2" />
        <circle cx="100" cy="100" r="63" fill="none" stroke={fill} strokeWidth="1" />
        {dots.map((deg) => (
          <circle key={deg} cx="100" cy="32.5" r="1.8" transform={`rotate(${deg} 100 100)`} />
        ))}
        {[0, 90, 180, 270].map((deg) => (
          <rect key={deg} x="94" y="16" width="12" height="12" transform={`rotate(${deg} 100 100) rotate(45 100 22)`} />
        ))}
        <text x="100" y="129" textAnchor="middle" fontSize="86" style={{ fontFamily: 'var(--font-display), Georgia, serif' }}>P</text>
      </g>
      <text x="150" y="168" textAnchor="middle" fontSize="34" textLength="250" lengthAdjust="spacing" style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 400 }}>PANCHALII</text>
      <rect x="62" y="190" width="54" height="1.2" />
      <rect x="184" y="190" width="54" height="1.2" />
      <text x="150" y="195" textAnchor="middle" fontSize="12" textLength="56" lengthAdjust="spacing" style={{ fontFamily: 'var(--font-body), sans-serif' }}>SELECT</text>
    </g>
  );
}

export default function BrandMark({ className = '', shine = false }: { className?: string; shine?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 300 210" className={className} role="img" aria-label="Panchalii Select">
      <defs>
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E9D29B" />
          <stop offset="45%" stopColor="#C9A96E" />
          <stop offset="100%" stopColor="#957546" />
        </linearGradient>
        {shine && (
          <>
            <linearGradient id={`band-${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFF6DC" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFF6DC" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FFF6DC" stopOpacity="0" />
            </linearGradient>
            <mask id={`mask-${id}`}>
              <Shapes fill="#fff" />
            </mask>
          </>
        )}
      </defs>
      <Shapes fill={`url(#gold-${id})`} />
      {shine && (
        <g mask={`url(#mask-${id})`}>
          <rect className="entry-shine" x="-120" y="0" width="110" height="210" fill={`url(#band-${id})`} transform="skewX(-18)" />
        </g>
      )}
    </svg>
  );
}
