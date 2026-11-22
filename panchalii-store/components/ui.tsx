import Link from 'next/link';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow: string; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
      <div>
        <p className="label-eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display font-light text-cream text-4xl md:text-5xl leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-cream-muted mt-2">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function SectionTitle({ number, title, aside }: { number?: string; title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      {number && <span className="font-display text-gold text-lg">{number}</span>}
      <h2 className="font-display text-cream text-2xl md:text-3xl flex-1">{title}</h2>
      {aside && <span className="text-[10px] uppercase tracking-[0.2em] text-cream-muted">{aside}</span>}
    </div>
  );
}

export function DiamondRule({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="w-10 h-px bg-gold/50" />
      <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
      <span className="w-10 h-px bg-gold/50" />
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; trailing?: ReactNode };

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, trailing, id, className = '', ...props }, ref) {
  const fieldId = id || props.name;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-muted mb-2">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={`input ${trailing ? 'pr-11' : ''} ${error ? '!border-error' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
      {error ? <p className="text-xs text-error mt-1.5">{error}</p> : hint ? <p className="text-xs text-cream-muted/70 mt-1.5">{hint}</p> : null}
    </div>
  );
});

export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return <span className={`inline-block ${className} border border-current border-t-transparent rounded-full animate-spin`} aria-hidden="true" />;
}

export function EmptyState({ icon, eyebrow, title, body, action }: { icon?: ReactNode; eyebrow?: string; title: string; body?: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  return (
    <div className="text-center py-16 px-6 max-w-md mx-auto">
      {icon && <div className="w-20 h-20 rounded-full border border-gold/35 flex items-center justify-center mx-auto mb-7 text-gold/70">{icon}</div>}
      {eyebrow && <p className="label-eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-display font-light text-cream text-3xl md:text-4xl">{title}</h2>
      {body && <p className="text-sm text-cream-muted mt-3 leading-relaxed">{body}</p>}
      {action && (
        <div className="mt-8">
          {action.href ? (
            <Link href={action.href} className="btn-secondary">{action.label}</Link>
          ) : (
            <button onClick={action.onClick} className="btn-secondary">{action.label}</button>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Awaiting payment', color: '#E0B354' },
  confirmed: { label: 'Confirmed', color: '#C9A96E' },
  processing: { label: 'Being prepared', color: '#C9A96E' },
  shipped: { label: 'On its way', color: '#8FB8DE' },
  delivered: { label: 'Delivered', color: '#7FC79A' },
  cancelled: { label: 'Cancelled', color: '#E5797D' },
  refunded: { label: 'Refunded', color: '#B8A98A' },
};

export const statusStyle = (s?: string) => STATUS[s || ''] || { label: s || 'Unknown', color: '#B8A98A' };

export function StatusBadge({ status }: { status?: string }) {
  const s = statusStyle(status);
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] border"
      style={{ color: s.color, borderColor: `${s.color}73`, backgroundColor: `${s.color}1f` }}
    >
      {s.label}
    </span>
  );
}

export const icons = {
  bag: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  heart: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  box: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m0 10L4 17V7m8 14V11" /></svg>,
  pin: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  bell: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" /></svg>,
  search: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
};
