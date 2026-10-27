import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, Eye, EyeOff, Lock, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { formatLatLon } from '../../lib/coords.js';

const COAST =
  'C1150,402 1120,418 1080,410 C1040,402 1010,420 960,414 C920,409 900,398 860,404 C820,410 800,428 760,422 C720,416 700,398 660,404 C630,408 600,420 580,428 C565,436 548,444 552,470 C556,500 536,520 544,550 C552,580 530,610 540,640 C548,670 528,700 536,730 L532,780';
const SHIP = 'M8 1 L13.5 14.5 L8 11.2 L2.5 14.5 Z';
const SHIPS = [[700, 268, 100], [420, 520, 10], [610, 160, 250], [780, 520, 80], [300, 760, 185]];

const PORTS = [
  ['Port of Colombo', 6.95, 79.845],
  ['Port of Singapore', 1.264, 103.84],
  ['Port of Shanghai', 31.23, 121.47],
  ['Port of Rotterdam', 51.9225, 4.4792],
  ['Jebel Ali, Dubai', 25.011, 55.061],
  ['Port of Hamburg', 53.546, 9.966],
  ['Port of Los Angeles', 33.74, -118.27],
  ['Port of Santos', -23.96, -46.31],
];
const PORT_MS = 4000;

const focusRing = 'outline-none focus-visible:outline-bs-accent';
const inputCls =
  'w-full h-[38px] pl-9 py-1.5 text-[13px] text-bs-ink caret-bs-accent bg-bs-surface border border-bs-ink/[.16] rounded-sm ' +
  'placeholder:text-bs-ink/65 hover:border-bs-ink/45 focus-visible:border-bs-accent focus-visible:outline-offset-0 ' + focusRing;
const inputIcon = 'absolute left-3 top-[11px] text-bs-neutral-700 pointer-events-none';
const bgGlow = '[text-shadow:0_0_12px_rgb(var(--bs-bg)),0_0_4px_rgb(var(--bs-bg))]';

// Decorative chart: coastline with depth contours, a restricted area, and vessels.
function ChartArt() {
  return (
    <svg
      viewBox="0 0 860 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      className="absolute inset-0 w-full h-full opacity-[.45]"
    >
      <defs>
        <pattern id="sg-dots" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.85" className="fill-bs-ink" opacity="0.22" />
        </pattern>
        <path id="sg-coast" fill="none" d={`M1200,408 ${COAST}`} />
      </defs>
      <g className="stroke-bs-neutral-200" strokeWidth="1">
        {[150, 366, 582, 798].map((y) => <line key={y} x1="0" y1={y} x2="860" y2={y} />)}
        {[200, 462, 724].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="900" />)}
      </g>
      <g transform="translate(-120,190)">
        <g className="fill-none stroke-bs-accent-300" strokeWidth="1">
          <use href="#sg-coast" transform="translate(-26,-30)" />
          <use href="#sg-coast" transform="translate(-62,-78)" strokeDasharray="5 4" />
          <use href="#sg-coast" transform="translate(-110,-150)" strokeDasharray="2 5" />
          <use href="#sg-coast" transform="translate(-170,-240)" strokeDasharray="1 6" />
        </g>
        <path d={`M1200,780 L1200,408 ${COAST} Z`} className="fill-bs-neutral-200" />
        <path d={`M1200,780 L1200,408 ${COAST} Z`} fill="url(#sg-dots)" />
        <use href="#sg-coast" className="stroke-bs-ink" strokeWidth="1.2" />
        <polygon
          points="880,296 962,286 978,352 890,364"
          className="fill-bs-accent-2-100/70 stroke-bs-accent-2" strokeWidth="1.4" strokeDasharray="6 4"
        />
      </g>
      <g className="fill-none stroke-bs-accent" strokeWidth="1.6" strokeDasharray="1 5" strokeLinecap="round">
        <path d="M520,250 C580,236 640,250 700,268" />
        <path d="M380,640 C400,600 410,560 420,520" />
      </g>
      <g className="fill-bs-ink stroke-bs-bg" strokeWidth="1.4" strokeLinejoin="round">
        {SHIPS.map(([x, y, r]) => (
          <path key={`${x},${y}`} d={SHIP} transform={`translate(${x},${y}) rotate(${r}) translate(-8,-8)`} />
        ))}
      </g>
      <g transform="translate(560,470)">
        <rect x="-14" y="-14" width="28" height="28" className="fill-none stroke-bs-accent-2" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d={SHIP} transform="rotate(35) translate(-8,-8)" className="fill-bs-accent-2 stroke-bs-bg" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = new Date(now).toISOString().slice(11, 19);
  const portIdx = Math.floor(now / PORT_MS) % PORTS.length;
  const [portName, portLat, portLon] = PORTS[portIdx];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ identifier, password });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Check your operator email or passcode and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bs-bg text-bs-ink font-sans text-[14px] leading-[1.55] selection:bg-bs-accent/30">
      <section className="hidden lg:block relative basis-3/5 shrink-0 overflow-hidden">
        <ChartArt />
        <div className="absolute left-16 top-12 right-16 flex items-center text-[12px]">
          <span className="flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full bg-bs-accent" />
            <span className="italic">Live AIS feed</span>
          </span>
          <span className="ml-auto flex items-center gap-2">
            <Clock size={16} className="text-bs-neutral-700" />
            <b className="font-mono font-medium">{clock}</b>
            <span className="italic">UTC</span>
          </span>
        </div>
        <div className="absolute left-16 top-[27%] max-w-[620px]">
          <div className="text-[10px] tracking-[0.1em] uppercase font-semibold text-bs-accent-700">Maritime surveillance</div>
          <h1 className={`mt-3.5 mb-[18px] text-[clamp(52px,8.6vh,76px)] leading-[1.02] tracking-[-0.03em] font-semibold text-balance ${bgGlow}`}>
            Maritime domain awareness, <span className="text-bs-accent-700">in real time.</span>
          </h1>
          <p className="max-w-[420px] text-[clamp(14px,1.8vh,16px)] italic [text-shadow:0_0_8px_rgb(var(--bs-bg))]">
            Every AIS transmission in the sector, read, checked and flagged as it arrives.
          </p>
        </div>
        <div
          key={portIdx}
          className="absolute left-16 bottom-10 flex gap-2.5 items-baseline text-[12px] animate-port-in motion-reduce:animate-none"
        >
          <span className="italic text-bs-neutral-800">{portName}</span>
          <span className="font-mono">{formatLatLon(portLat, portLon)}</span>
        </div>
      </section>

      <section className="flex-1 min-w-0 flex flex-col pt-12 pb-10 px-[clamp(16px,5vw,72px)]">
        <div className="flex items-baseline gap-2.5">
          <span className="font-semibold text-[19px] tracking-[-0.02em]">SerenGuard</span>
          <span className="italic text-[12px] text-bs-neutral-700">Maritime surveillance</span>
        </div>

        <form className="my-auto flex flex-col gap-[22px] w-full max-w-[400px]" onSubmit={handleSubmit}>
          <div>
            <h2 className="mb-1.5 text-[clamp(22px,2.9vh,26px)] font-semibold leading-[1.12] tracking-[-0.015em]">Sign in</h2>
            <p className="italic text-[14px] text-bs-neutral-800">Use your operator credentials to open the terminal.</p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex gap-2.5 items-start px-3 py-2.5 text-[13px] rounded-sm bg-bs-accent-2-100 text-bs-accent-2-700 border-l-[3px] border-bs-accent-2"
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="sg-email" className="block mb-[5px] text-[11px] text-bs-ink/70">Operator email</label>
            <div className="relative">
              <User size={16} className={inputIcon} />
              <input
                id="sg-email" className={`${inputCls} pr-2.5`} type="text" autoComplete="username" required
                placeholder="operator@serenguard.ops"
                value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="sg-pass" className="block mb-[5px] text-[11px] text-bs-ink/70">Password</label>
            <div className="relative">
              <Lock size={16} className={inputIcon} />
              <input
                id="sg-pass" className={`${inputCls} pr-10`} type={showPassword ? 'text' : 'password'}
                autoComplete="current-password" required placeholder="Enter password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={`absolute right-[3px] top-[3px] w-8 h-8 inline-flex items-center justify-center rounded-sm text-bs-neutral-700 ${focusRing}`}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={submitting}
            className={`inline-flex items-center justify-center gap-1.5 h-[42px] px-[18px] rounded-sm bg-bs-accent text-bs-bg text-[14px] font-semibold hover:enabled:bg-bs-accent-600 active:enabled:bg-bs-accent-700 disabled:opacity-[.45] disabled:cursor-not-allowed ${focusRing}`}
          >
            {submitting ? 'Signing in…' : 'Sign in to terminal'}
            <ArrowRight size={16} />
          </button>

          <div className="text-[13px]">
            <span className="italic text-bs-neutral-800">Forgot your passcode?</span>{' '}
            <a href="#admin-contact" className={`text-bs-accent-700 underline underline-offset-[3px] hover:text-bs-accent-800 ${focusRing}`}>
              Contact your administrator
            </a>
          </div>
        </form>

        <div className="italic text-[12px] text-bs-neutral-800">Authorised personnel only. All activity is logged.</div>
      </section>
    </div>
  );
}
