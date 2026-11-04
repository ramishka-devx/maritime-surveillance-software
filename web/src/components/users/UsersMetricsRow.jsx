import React from 'react';
import { CircleCheck, CircleSlash, Clock, Users } from 'lucide-react';
import { kicker } from '../ui/bs.js';

// Headline figures, in the Dashboard's style.
export default function UsersMetricsRow({ totalCount, activeCount, deactivatedCount, pendingCount }) {
  const share = (n) => (totalCount > 0 ? `${Math.round((n / totalCount) * 100)}% of accounts` : '—');
  const figures = [
    { label: 'Accounts', icon: Users, value: totalCount, note: 'All users' },
    {
      label: 'Active',
      icon: CircleCheck,
      value: activeCount,
      note: share(activeCount),
      accent: true,
    },
    {
      label: 'Deactivated',
      icon: CircleSlash,
      value: deactivatedCount,
      note: 'Cannot sign in',
      alert: deactivatedCount > 0,
    },
    {
      label: 'Pending',
      icon: Clock,
      value: pendingCount,
      note: 'Awaiting verification',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
      {figures.map(({ label, icon, value, note, accent, alert }) => {
        const Icon = icon;
        return (
          <div key={label} className="flex flex-col gap-1.5 min-w-0">
            <div className={`flex items-center gap-2 ${kicker} ${alert ? 'text-bs-accent-2-700' : ''}`}>
              <Icon size={15} />
              {label}
            </div>
            <span
              className={`text-[40px] font-semibold leading-none tracking-[-0.02em] tabular-nums ${
                alert ? 'text-bs-accent-2-700' : accent ? 'text-bs-accent-700' : ''
              }`}
            >
              {value}
            </span>
            <div className="text-[13px] italic text-bs-neutral-800 truncate">{note}</div>
          </div>
        );
      })}
    </div>
  );
}
