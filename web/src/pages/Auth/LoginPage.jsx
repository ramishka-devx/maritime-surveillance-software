import React from 'react';
import MapHero from '../../components/auth/MapHero.jsx';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { SecurityComplianceFooter } from '../../components/auth/SecurityCompliance.jsx';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between selection:bg-cyan-500 selection:text-black bg-[#0B1220] font-sans">
      {/* Main Split-Screen Container */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* LEFT 60% (col-span-7 on desktop): Dark Stylized World Map with Shipping Lanes */}
        <MapHero />

        {/* RIGHT 40% (col-span-5 on desktop): Authentication Panel & Centered Login Card */}
        <section className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-[#0B1220] relative">
          {/* Subtle background ambient grid for right side */}
          <div className="absolute inset-0 map-grid-bg opacity-30 pointer-events-none" />

          {/* Centered Login Card */}
          <LoginForm />

          {/* Security Classification Footer */}
          <SecurityComplianceFooter />
        </section>
      </main>
    </div>
  );
}
