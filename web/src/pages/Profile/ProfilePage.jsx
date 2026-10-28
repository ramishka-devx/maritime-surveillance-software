import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import ProfileHeaderBar from '../../components/profile/ProfileHeaderBar.jsx';
import ProfileDossierCard from '../../components/profile/ProfileDossierCard.jsx';
import ProfileAccountTab from '../../components/profile/ProfileAccountTab.jsx';
import ProfileSecurityTab from '../../components/profile/ProfileSecurityTab.jsx';
import ProfileActivityTab from '../../components/profile/ProfileActivityTab.jsx';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  return (
    <div className="w-full h-full overflow-y-auto select-none bg-slate-100 text-slate-900 p-4 pt-3 pb-16 font-sans">
      <div className="flex flex-col gap-5 max-w-[1920px] mx-auto pb-8">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-cyan-50 border border-cyan-300 text-cyan-900 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-bounce font-mono text-xs">
            <span className="material-symbols-outlined text-[#0891b2] text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Header / Command Strip */}
        <ProfileHeaderBar user={user} />

        {/* 2. Main Workplace Grid */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Column: Operator Identity Dossier Card */}
          <div className="w-full lg:w-72 shrink-0">
            <ProfileDossierCard user={user} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-5 w-full">
            <ProfileAccountTab user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
