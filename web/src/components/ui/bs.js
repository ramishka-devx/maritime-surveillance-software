// Broadsheet class strings shared by the admin pages (Users, Roles & access). They match the
// ones Alerts, Dashboard, Reports and Restricted areas define inline.

export const focusRing = 'outline-none focus-visible:outline-bs-accent';
export const pageShell = 'w-full h-full overflow-y-auto bg-slate-100 text-bs-ink font-sans pt-3 pl-8 pr-6 pb-12';
export const pageTitle = 'text-2xl font-bold uppercase tracking-tight text-slate-900 m-0';
export const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
export const h2 = 'text-[19px] font-semibold tracking-[-0.01em] m-0';

export const btn = `inline-flex items-center justify-center gap-1.5 px-[18px] py-2.5 rounded-sm border text-[13px] font-semibold disabled:opacity-45 disabled:cursor-not-allowed ${focusRing}`;
export const btnPrimary = 'border-transparent bg-bs-accent text-bs-bg hover:enabled:bg-bs-accent-600';
export const btnNeutral = 'border-bs-ink/[.16] bg-bs-bg hover:enabled:bg-bs-ink/[.07]';
export const linkBase = `inline-flex items-center gap-1 text-[13px] font-semibold disabled:opacity-45 disabled:cursor-not-allowed ${focusRing}`;
export const linkBtn = `${linkBase} text-bs-accent-700 hover:text-bs-accent-800`;
export const linkDanger = `${linkBase} text-bs-accent-2-700 hover:text-bs-accent-2-500`;

export const field = `w-full h-[38px] px-2.5 text-[13px] bg-bs-surface border border-bs-ink/[.16] rounded-sm hover:border-bs-ink/45 focus-visible:border-bs-accent ${focusRing} focus-visible:outline-offset-0`;
export const label = 'block mb-[5px] text-[11px] text-bs-ink/70';

export const th = 'font-normal py-2.5 px-2.5 first:pl-0 border-b border-bs-ink/[.16]';
export const td = 'py-[11px] px-2.5 first:pl-0 align-middle';

// Small status / category tag.
export const tag = 'inline-block text-[11px] px-2 py-px rounded-sm whitespace-nowrap';
export const tagNeutral = 'bg-bs-neutral-100 text-bs-neutral-800';
export const tagAccent = 'bg-bs-accent-100 text-bs-accent-700';
export const tagAlert = 'bg-bs-accent-2-100 text-bs-accent-2-700';
