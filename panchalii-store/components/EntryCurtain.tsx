'use client';
import { useEffect, useRef, useState } from 'react';
import BrandMark from './BrandMark';
import { ENTRY_SEEN_KEY } from '../lib/entry';
const STRIPS = 14;

// Timeline (ms), matched to the reference recording
const LOGO_FLY_AT = 1150;
const LOGO_FLY_MS = 420;
const REVEAL_COPY_AT = 2250;
const DONE_AT = 3200;

const strips = Array.from({ length: STRIPS }, (_, i) => {
  const center = (i + 0.5) / STRIPS;
  const left = center < 0.5;
  const fromEdge = left ? center : 1 - center;
  // Each fold gathers toward its own edge; centre folds move first and farthest
  // Small per-fold jitter so the folds separate unevenly, like real fabric
  const jitter = ((i * 53) % 7) / 6;
  const dx = (left ? -1 : 1) * fromEdge * (0.8 + 0.12 * jitter) * 100;
  const delay = Math.round((0.5 - fromEdge) * 2 * 240 + jitter * 70);
  const tone = 0.92 + (((i * 37) % 11) / 10) * 0.16;
  // Outer folds sit on top so inner folds tuck underneath as the curtain gathers
  const z = Math.round((0.5 - fromEdge) * 100);
  return { i, dx, delay, tone, z };
});

export default function EntryCurtain() {
  const [phase, setPhase] = useState<'pending' | 'playing' | 'done'>('pending');
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains('entry-skip')) { setPhase('done'); return; }
    root.classList.add('entry-playing');
    setPhase('playing');

    const timers: ReturnType<typeof setTimeout>[] = [];
    let fly: Animation | undefined;

    timers.push(setTimeout(() => {
      const logo = logoRef.current;
      const target = document.querySelector<HTMLElement>('[data-entry-logo]');
      if (!logo || !target) return;
      const from = logo.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const scale = to.height / from.height;
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      fly = logo.animate(
        [{ transform: 'translate(0, 0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
        { duration: LOGO_FLY_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
      );
      fly.onfinish = () => root.classList.add('entry-landed');
    }, LOGO_FLY_AT));

    timers.push(setTimeout(() => root.classList.add('entry-reveal'), REVEAL_COPY_AT));
    timers.push(setTimeout(() => finish(), DONE_AT));

    return () => {
      timers.forEach(clearTimeout);
      fly?.cancel();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = () => finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  function finish() {
    try { sessionStorage.setItem(ENTRY_SEEN_KEY, '1'); } catch {}
    const root = document.documentElement;
    root.classList.add('entry-landed', 'entry-reveal');
    root.classList.remove('entry-playing');
    setPhase('done');
  }

  if (phase === 'done') return null;

  return (
    <div className={`entry-curtain ${phase === 'playing' ? 'is-playing' : ''}`} onClick={finish} role="presentation">
      {strips.map((s) => (
        <div
          key={s.i}
          className="entry-curtain__fold"
          style={{
            left: `${(s.i / STRIPS) * 100}%`,
            width: `${100 / STRIPS + 0.2}%`,
            filter: `brightness(${s.tone.toFixed(2)})`,
            zIndex: s.z,
            ['--dx' as string]: `${s.dx.toFixed(2)}vw`,
            ['--delay' as string]: `${s.delay}ms`,
          }}
        />
      ))}
      <div ref={logoRef} className="entry-curtain__logo">
        <BrandMark shine className="h-[200px] md:h-[260px] w-auto" />
      </div>
    </div>
  );
}
