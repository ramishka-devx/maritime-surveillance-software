import React, { useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { btn, btnNeutral, btnPrimary, field, focusRing, label, linkBtn } from '../ui/bs.js';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';

function generatePassword(length = 16) {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('');
}

const usernameFromEmail = (email) => email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');

// "Add user" dialog. Mount it only while open, so each open starts blank with a fresh password.
// POST /api/users/register always creates a verified operator and sends no email.
export default function UsersDrawer({ onClose, onCreateUser }) {
  const [form, setForm] = useState({ first: '', last: '', email: '', username: '', password: generatePassword() });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const username = form.username.trim() || usernameFromEmail(form.email.trim());
  const valid = form.first.trim() && form.last.trim() && form.email.trim() && username.length >= 3 && form.password.length >= 6;

  const copy = () => {
    navigator.clipboard?.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onCreateUser({ first_name: form.first.trim(), last_name: form.last.trim(), email: form.email.trim(), username, password: form.password });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not create the user.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add user"
      subtitle="New accounts are operators and can sign in straight away. No email is sent, so share the password securely."
      onClose={onClose}
      busy={saving}
      footer={
        <>
          {error && <span role="alert" className="text-[13px] italic text-bs-accent-2-700 mr-auto">{error}</span>}
          <button type="button" onClick={onClose} disabled={saving} className={`${btn} ${btnNeutral} ml-auto`}>
            Cancel
          </button>
          <button type="submit" form="add-user-form" disabled={!valid || saving} className={`${btn} ${btnPrimary}`}>
            {saving ? 'Creating…' : 'Create user'}
          </button>
        </>
      }
    >
      <form id="add-user-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="user-first" className={label}>First name</label>
            <input id="user-first" autoFocus required maxLength={50} value={form.first} onChange={(e) => set({ first: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="user-last" className={label}>Last name</label>
            <input id="user-last" required maxLength={50} value={form.last} onChange={(e) => set({ last: e.target.value })} className={field} />
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
          <div>
            <label htmlFor="user-email" className={label}>Email</label>
            <input id="user-email" type="email" required maxLength={100} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" className={field} />
          </div>
          <div>
            <label htmlFor="user-username" className={label}>Username</label>
            <input
              id="user-username"
              value={form.username}
              maxLength={50}
              pattern="[A-Za-z0-9._\-]{3,50}"
              onChange={(e) => set({ username: e.target.value })}
              placeholder={usernameFromEmail(form.email) || 'from email'}
              className={`${field} font-mono`}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="user-password" className={label}>Temporary password</label>
            <button type="button" onClick={() => set({ password: generatePassword() })} className={`${linkBtn} text-[12px] mb-[5px]`}>
              <RefreshCw size={13} />
              Generate new
            </button>
          </div>
          <div className="relative">
            <input
              id="user-password"
              required
              minLength={6}
              maxLength={128}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              className={`${field} pr-10 font-mono`}
            />
            <button
              type="button"
              onClick={copy}
              aria-label="Copy password"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-sm text-bs-neutral-700 hover:bg-bs-ink/[.07] ${focusRing}`}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
