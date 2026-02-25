import React, { useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePermission } from '../auth/usePermission.js';

export default function RequestAccessGate({
  permission,
  permissions,
  requireAll = false,
  featureName,
  children,
}) {
  const { token } = useAuth();
  const { can, canAny, canAll } = usePermission();

  const requiredList = useMemo(() => {
    if (permission) return [permission];
    return Array.isArray(permissions) ? permissions.filter(Boolean) : [];
  }, [permission, permissions]);

  const hasAccess = useMemo(() => {
    if (permission) return can(permission);
    if (requiredList.length > 0) return requireAll ? canAll(requiredList) : canAny(requiredList);
    return true;
  }, [can, canAll, canAny, permission, requireAll, requiredList]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const displayPermission = requiredList[0] || '';
  const title = featureName || 'This feature';

  const submit = async () => {
    if (!displayPermission) return;

    setError('');
    setIsSubmitting(true);
    try {
      await apiRequest('/api/permissions/request-access', {
        token,
        method: 'POST',
        body: {
          permission: displayPermission,
        },
      });
      setSent(true);
    } catch (e) {
      setError(e?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasAccess) return children;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[1px]">
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-[560px] rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="text-sm font-extrabold text-white">Access required</div>
          <div className="mt-1 text-xs font-semibold text-text-muted">
            You don&apos;t have permission to use <span className="text-white/80">{title}</span>.
          </div>

          {displayPermission && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-extrabold text-white/80">
              Required permission: <span className="text-white">{displayPermission}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting || sent}
              className={[
                'rounded-xl bg-accent-orange px-4 py-2 text-[12px] font-extrabold text-white transition',
                sent
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-[#d97706] shadow-[0_8px_18px_rgba(242,140,27,0.20)]',
              ].join(' ')}
            >
              {sent ? 'Request sent' : isSubmitting ? 'Requesting...' : 'Request access'}
            </button>

            <div className="text-[11px] font-semibold text-text-muted">
              Your request will be sent to a super admin.
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] font-extrabold text-red-200">
              {error}
            </div>
          )}

          {sent && (
            <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-extrabold text-emerald-200">
              Request submitted. You&apos;ll get access once an admin grants the permission.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
