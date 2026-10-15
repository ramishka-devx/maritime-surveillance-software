import React from 'react';

export function SecurityComplianceBadge() {
  return (
    <div className="relative z-10 flex justify-end">
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#111A2B] border border-[#1F2A40] text-[11px] font-mono text-[#8A99B3]">
        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>TLS 1.3 // FIPS-140-3 COMPLIANT</span>
      </div>
    </div>
  );
}

export function SecurityComplianceFooter() {
  return (
    <footer className="relative z-10 mt-8 text-center border-t border-[#1F2A40]/80 pt-5">
      <p className="text-xs text-[#8A99B3]/90 font-mono tracking-wide">
        Authorized personnel only. All activity is logged.
      </p>
    </footer>
  );
}
