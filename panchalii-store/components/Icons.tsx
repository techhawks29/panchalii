type P = { className?: string };

export const Arrow = ({ className }: P) => (
  <svg className={className} viewBox="0 0 28 12" width="26" height="12" aria-hidden="true">
    <path d="M0 6h26M21 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export const Lotus = ({ className }: P) => (
  <svg className={className} viewBox="0 0 48 30" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M24 28c-3-6-3-14 0-22 3 8 3 16 0 22Z" />
      <path d="M24 28c-6-3-10-10-11-18 6 3 10 10 11 18Z" />
      <path d="M24 28c6-3 10-10 11-18-6 3-10 10-11 18Z" />
      <path d="M24 28c-8-1-15-6-18-12 7 0 14 5 18 12Z" />
      <path d="M24 28c8-1 15-6 18-12-7 0-14 5-18 12Z" />
      <path d="M8 29h32" />
    </g>
  </svg>
);

export const Monogram = ({ className }: P) => (
  <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
    <g fill="none" stroke="currentColor">
      <circle cx="60" cy="60" r="40" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="35" strokeWidth=".8" />
      <path strokeWidth="1" d="M60 8l5 8-5 5-5-5 5-8ZM60 112l5-8-5-5-5 5 5 8ZM8 60l8 5 5-5-5-5-8 5ZM112 60l-8 5-5-5 5-5 8 5Z" />
      <g strokeWidth=".9" opacity=".9">
        <path d="M60 20c6 4 10 4 14 2M60 20c-6 4-10 4-14 2M60 100c6-4 10-4 14-2M60 100c-6-4-10-4-14-2M20 60c4 6 4 10 2 14M20 60c4-6 4-10 2-14M100 60c-4 6-4 10-2 14M100 60c-4-6-4-10-2-14" />
        <circle cx="31" cy="31" r="3" />
        <circle cx="89" cy="31" r="3" />
        <circle cx="31" cy="89" r="3" />
        <circle cx="89" cy="89" r="3" />
      </g>
    </g>
    <text x="60" y="73" textAnchor="middle" style={{ fontFamily: "var(--serif)" }} fontSize="38" fontWeight="500" fill="currentColor">
      P
    </text>
  </svg>
);

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.3 } as const;

export const Search = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" /><path d="m20 20-4.5-4.5" /></svg>
);
export const User = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c.5-4.5 3.8-7 8-7s7.5 2.5 8 7" /></svg>
);
export const Heart = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" {...stroke} fill={filled ? "currentColor" : "none"} aria-hidden="true">
    <path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 6.6a4.5 4.5 0 0 1 8 2.9c0 6.1-8 11-8 11Z" />
  </svg>
);
export const Bag = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M5 8h14l-1.2 13H6.2L5 8Z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></svg>
);
export const Menu = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
);
export const Close = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg>
);
export const Shield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
);
export const Truck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M2 7h12v9H2zM14 10h4.5L22 13.5V16h-8z" /><circle cx="6" cy="18" r="1.8" /><circle cx="18" cy="18" r="1.8" /></svg>
);
export const Returns = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /></svg>
);
export const Instagram = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".7" fill="currentColor" /></svg>
);
export const Facebook = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" /></svg>
);
export const Pinterest = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M10 21l2-8M9.5 14.5C8 13.8 7.5 12.4 7.5 11c0-3 2.4-5.5 5-5.5 2.8 0 4.5 2 4.5 4.5 0 3-1.7 5-3.7 5-1.2 0-2-1-1.7-2.2l.8-3" /></svg>
);
export const YouTube = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" /></svg>
);
export const WhatsApp = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z" /><path d="M9 9.5c.5 2.5 2.5 4.5 5 5l1.2-1.2 1.8.8-.5 1.8c-4 .5-8.5-4-8-8l1.8-.5.8 1.8L9 9.5Z" /></svg>
);
