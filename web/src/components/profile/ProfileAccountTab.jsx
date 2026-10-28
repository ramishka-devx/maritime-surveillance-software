import React, { useState, useEffect } from 'react';

export default function ProfileAccountTab({ user, onSaveNotice }) {
  const [formData, setFormData] = useState({
    fullName: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Carlos Martinez' : 'Carlos Martinez',
    center: 'Colombo',
    email: user?.email || 'c.martinez@serenguard.maritime.mil',
    username: user?.username || 'admin',
    timezone: 'UTC',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || prev.fullName,
        email: user.email || prev.email,
        username: user.username || prev.username,
      }));
    }
  }, [user]);

  const [sogUnit, setSogUnit] = useState('kn');
  const [rangeUnit, setRangeUnit] = useState('NM');
  const [coordUnit, setCoordUnit] = useState('DMS');
  const [bathyUnit, setBathyUnit] = useState('m');

  const [pushNotifs, setPushNotifs] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [smsRelay, setSmsRelay] = useState(false);
  const [ackChime, setAckChime] = useState(true);

  const handleTestTone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext fallback
    }
    if (onSaveNotice) onSaveNotice('850Hz Acoustic Pulse Test Tone Dispatched.');
  };

  const handleSave = () => {
    if (onSaveNotice) onSaveNotice('Operational profile and unit calibration preferences saved successfully.');
  };

  const handleDiscard = () => {
    setFormData({
      fullName: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Carlos Martinez' : 'Carlos Martinez',
      center: 'Colombo',
      email: user?.email || 'c.martinez@serenguard.maritime.mil',
      username: user?.username || 'admin',
      timezone: 'UTC',
    });
    setSogUnit('kn');
    setRangeUnit('NM');
    setCoordUnit('DMS');
    setBathyUnit('m');
    if (onSaveNotice) onSaveNotice('Preferences restored to default baseline.');
  };

  return (
    <div className="bg-white rounded-lg p-5 sm:p-6 shadow-sm flex flex-col gap-6 border border-slate-200 font-sans select-none">
      {/* Section 1: Personal & Operational Information */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0891b2] text-[20px]">person_pin</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase m-0">
              Personal &amp; Operational Information
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Field 1: Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Full Legal &amp; Command Name
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                badge
              </span>
              <input
                className="w-full bg-slate-50 text-slate-900 font-mono text-xs rounded pl-10 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2] focus:bg-white transition-colors"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          {/* Field 2: Operating Center */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Operating Center
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#0891b2] text-[18px]">
                military_tech
              </span>
              <input
                className="w-full bg-slate-50 text-slate-900 font-mono text-xs rounded pl-10 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2] focus:bg-white transition-colors"
                type="text"
                value={formData.center}
                onChange={(e) => setFormData({ ...formData, center: e.target.value })}
              />
            </div>
          </div>

          {/* Field 3: Official Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Official Email
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                mail
              </span>
              <input
                className="w-full bg-slate-50 text-slate-900 font-mono text-xs rounded pl-10 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2] focus:bg-white transition-colors"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Field 4: System Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              System Username
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                alternate_email
              </span>
              <input
                className="w-full bg-slate-50 text-slate-900 font-mono text-xs rounded pl-10 pr-3 py-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2] focus:bg-white transition-colors"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          {/* Field 5: Timezone */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Operational Console Timezone
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#0891b2] text-[18px]">
                public
              </span>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 font-mono text-xs rounded pl-10 pr-10 py-2 border border-slate-200 focus:outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2] focus:bg-white transition-colors appearance-none cursor-pointer"
              >
                <option value="UTC">UTC (Coordinated Universal Time) [Standard Operations]</option>
                <option value="BST">BST (UTC+1) [British Summer Time - Local Sector 04]</option>
                <option value="CET">CET (UTC+1) [Central European Time]</option>
                <option value="EDT">EDT (UTC-4) [Eastern Daylight Time - US LNO Link]</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-[20px]">
                arrow_drop_down
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-500">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">info</span>
              <span>
                Notice: All radar telemetry and interdiction logs remain strictly indexed in UTC standard across all sectors.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Notification & Acoustic Preferences */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0891b2] text-[20px]">
              notifications_active
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase m-0">
              Acoustic &amp; Dispatch Preferences
            </h2>
          </div>
          <span className="font-mono text-xs text-emerald-700 font-semibold">AUDIO SYNTH: READY</span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Toggle 1: Push */}
          <div className="bg-slate-50 p-3.5 rounded flex items-center justify-between gap-4 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-white text-[#0891b2] border border-slate-200 mt-0.5 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-slate-900 font-semibold">
                  Browser Push Notifications
                </span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Real-time dispatch notifications when console is minimized or operating secondary ENC views.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushNotifs}
              onChange={(e) => setPushNotifs(e.target.checked)}
              className="w-4 h-4 accent-[#0891b2] cursor-pointer"
            />
          </div>

          {/* Toggle 2: Sound */}
          <div className="bg-slate-50 p-3.5 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-white text-red-600 border border-slate-200 mt-0.5 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">campaign</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-slate-900 font-semibold">
                    Acoustic Critical Alert Synthesis
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-mono text-[10px] font-bold border border-red-200">
                    DEFCON PRIORITY
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Audible 850Hz pulsed alert tone for geofence breaches, transponder loss, and DEFCON escalations.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                type="button"
                onClick={handleTestTone}
                className="flex items-center gap-1 py-1 px-2.5 rounded bg-white hover:bg-slate-100 text-[#0891b2] font-mono text-xs border border-cyan-200 shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">volume_up</span>
                <span>Test Tone</span>
              </button>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#0891b2] cursor-pointer"
              />
            </div>
          </div>

          {/* Toggle 3: SAT-SMS */}
          <div className="bg-slate-50 p-3.5 rounded flex items-center justify-between gap-4 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-white text-blue-600 border border-slate-200 mt-0.5 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">cell_tower</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-slate-900 font-semibold">
                  High-Priority Telegram / SAT-SMS Relay
                </span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Automated cellular ping to duty officer phone when off-watch in the event of critical alert surges.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsRelay}
              onChange={(e) => setSmsRelay(e.target.checked)}
              className="w-4 h-4 accent-[#0891b2] cursor-pointer"
            />
          </div>

          {/* Toggle 4: Ack Chime */}
          <div className="bg-slate-50 p-3.5 rounded flex items-center justify-between gap-4 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-white text-emerald-600 border border-slate-200 mt-0.5 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm text-slate-900 font-semibold">
                  Incident Acknowledgment Chime
                </span>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Subtle acoustic click confirming successful operator triage submission and logging.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={ackChime}
              onChange={(e) => setAckChime(e.target.checked)}
              className="w-4 h-4 accent-[#0891b2] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Dock */}
      <div className="bg-slate-50 p-4 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-200 shadow-xs mt-2">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
          <span className="material-symbols-outlined text-[16px] text-emerald-600">find_replace</span>
          <span>Last updated by operator: 2025-05-14 09:21 UTC</span>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-3 py-2 rounded bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#0891b2] text-white font-bold uppercase transition-all hover:bg-[#0e7490] shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
