import React, { useEffect, useState } from 'react';

export default function MapHero() {
  const [slTime, setSlTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now);

      const getPart = (type) => parts.find((p) => p.type === type)?.value || '00';
      const hours = getPart('hour');
      const minutes = getPart('minute');
      const seconds = getPart('second');

      setSlTime(`SLST ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative lg:col-span-7 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#1F2A40] overflow-hidden bg-[#070D18]">
      {/* Ambient Grid & Depth Radial Gradient */}
      <div className="absolute inset-0 map-grid-bg pointer-events-none" />
      <div className="absolute inset-0 radar-sweep-subtle pointer-events-none" />

      {/* Range Rings Graphic in background */}
      <div className="absolute -left-20 -top-20 w-[680px] h-[680px] rounded-full border border-cyan-500/10 pointer-events-none" />
      <div className="absolute -left-4 w-[520px] top-12 h-[520px] rounded-full border border-cyan-500/5 pointer-events-none" />

      {/* Stylized SVG World Map with Faint Shipping Lanes and Pulsing Vessel Dots */}
      <div className="absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none">
        <svg className="w-full h-full max-h-[820px] scale-105" viewBox="0 0 1000 620" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="laneGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="laneGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
            </linearGradient>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Stylized Continent Silhouettes (Geometric Poly-Islands) */}
          <path d="M120 110 L240 100 L280 140 L310 170 L280 220 L240 230 L220 280 L200 320 L160 300 L140 250 L110 200 Z" fill="#132035" stroke="#1F3452" strokeWidth="1.2" opacity="0.65" />
          <path d="M330 60 L390 55 L380 95 L340 90 Z" fill="#132035" stroke="#1F3452" strokeWidth="1" opacity="0.45" />
          <path d="M220 330 L270 340 L310 390 L320 460 L280 540 L250 540 L230 460 L210 380 Z" fill="#132035" stroke="#1F3452" strokeWidth="1.2" opacity="0.65" />
          <path d="M470 120 L540 110 L580 140 L560 190 L510 210 L460 200 L450 160 Z" fill="#132035" stroke="#1F3452" strokeWidth="1.2" opacity="0.65" />
          <path d="M460 220 L540 220 L570 270 L580 340 L540 440 L490 440 L440 330 L430 260 Z" fill="#132035" stroke="#1F3452" strokeWidth="1.2" opacity="0.65" />
          <path d="M570 110 L780 110 L840 180 L860 260 L800 320 L740 310 L680 280 L620 250 L580 170 Z" fill="#132035" stroke="#1F3452" strokeWidth="1.2" opacity="0.65" />
          <path d="M750 330 L780 340 L820 380 L790 390 L750 360 Z" fill="#132035" stroke="#1F3452" strokeWidth="1" opacity="0.55" />
          <path d="M780 420 L860 410 L880 470 L850 510 L790 500 L760 460 Z" fill="#132035" stroke="#1F3452" strokeWidth="1.2" opacity="0.65" />

          {/* Faint Maritime Shipping Lanes */}
          <g strokeDasharray="3 3" opacity="0.75">
            {/* Transatlantic North */}
            <path d="M260 180 Q380 130 520 150" stroke="url(#laneGrad1)" strokeWidth="1.5" />
            {/* Mediterranean - Suez - Indian Ocean */}
            <path d="M510 195 Q570 240 680 300" stroke="url(#laneGrad2)" strokeWidth="1.8" filter="url(#cyanGlow)" />
            <path d="M680 300 Q740 360 830 380" stroke="url(#laneGrad1)" strokeWidth="1.5" />
            {/* Cape Route */}
            <path d="M490 220 Q480 380 540 460" stroke="url(#laneGrad1)" strokeWidth="1.2" />
            <path d="M540 460 Q620 440 700 340" stroke="url(#laneGrad1)" strokeWidth="1.2" />
            {/* Transpacific Routes */}
            <path d="M830 200 Q910 180 970 210" stroke="url(#laneGrad2)" strokeWidth="1.5" />
            <path d="M140 210 Q80 230 30 260" stroke="url(#laneGrad2)" strokeWidth="1.5" />
            {/* Malacca Strait Link */}
            <path d="M700 310 L740 340" stroke="#38BDF8" strokeWidth="2" strokeDasharray="none" filter="url(#cyanGlow)" />
          </g>

          {/* Live Vessel Indicators */}
          {/* Active Vessels: North Atlantic */}
          <g>
            <circle cx="340" cy="155" r="3" fill="#22D3EE" filter="url(#cyanGlow)" />
            <circle cx="340" cy="155" r="8" fill="none" stroke="#22D3EE" strokeWidth="0.8" opacity="0.4" className="animate-ping" />
            <polygon points="340,150 343,158 337,158" fill="#22D3EE" />
          </g>

          {/* Active Vessel: English Channel */}
          <g>
            <circle cx="495" cy="148" r="3.5" fill="#38BDF8" filter="url(#cyanGlow)" />
            <circle cx="495" cy="148" r="10" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.5" className="animate-ping" />
            <line x1="495" y1="148" x2="512" y2="140" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>

          {/* Active Vessel: Suez Canal Entry */}
          <g>
            <circle cx="585" cy="225" r="3" fill="#22D3EE" filter="url(#cyanGlow)" />
            <circle cx="585" cy="225" r="7" fill="none" stroke="#22D3EE" strokeWidth="0.8" opacity="0.4" />
          </g>

          {/* Active Vessel: Strait of Hormuz */}
          <g>
            <circle cx="645" cy="235" r="3" fill="#F59E0B" />
            <circle cx="645" cy="235" r="8" fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.6" className="animate-ping" />
          </g>

          {/* Active Vessel: Strait of Malacca */}
          <g>
            <circle cx="738" cy="338" r="3.5" fill="#22D3EE" filter="url(#cyanGlow)" />
            <circle cx="738" cy="338" r="9" fill="none" stroke="#22D3EE" strokeWidth="0.8" opacity="0.4" className="animate-ping" />
          </g>

          {/* Active Vessel: Singapore Anchorage */}
          <g>
            <circle cx="750" cy="350" r="3" fill="#34D399" />
            <circle cx="750" cy="350" r="6" fill="none" stroke="#34D399" strokeWidth="0.8" opacity="0.5" />
          </g>

          {/* Active Vessel: Panama Canal */}
          <g>
            <circle cx="232" cy="295" r="3" fill="#22D3EE" filter="url(#cyanGlow)" />
            <circle cx="232" cy="295" r="8" fill="none" stroke="#22D3EE" strokeWidth="0.8" opacity="0.5" className="animate-ping" />
          </g>

          {/* Anomaly Detection Reticle */}
          <g transform="translate(680, 290)">
            <circle cx="0" cy="0" r="16" fill="none" stroke="#EF4444" strokeWidth="1.2" strokeDasharray="4 2" className="animate-spin" style={{ animationDuration: '6s' }} />
            <circle cx="0" cy="0" r="2.5" fill="#EF4444" />
            <line x1="-20" y1="0" x2="-6" y2="0" stroke="#EF4444" strokeWidth="1" />
            <line x1="6" y1="0" x2="20" y2="0" stroke="#EF4444" strokeWidth="1" />
            <line x1="0" y1="-20" x2="0" y2="-6" stroke="#EF4444" strokeWidth="1" />
            <line x1="0" y1="6" x2="0" y2="20" stroke="#EF4444" strokeWidth="1" />
            <text x="24" y="4" fill="#EF4444" className="font-mono text-[9px] font-bold tracking-wider">DEV-402 ANOMALY</text>
          </g>
        </svg>
      </div>

      {/* Top Telemetry / Status Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#0D1829] border border-[#1F2A40]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-mono tracking-wider text-[#8A99B3]">
              LIVE AIS FEED: <span className="text-emerald-400 font-semibold">9,420 PKTS/S</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#0D1829] border border-[#1F2A40] text-[11px] font-mono text-[#8A99B3]"
            title="Sri Lanka Standard Time (Asia/Colombo UTC+05:30)"
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 7v5l3 2" />
            </svg>
            <span>{slTime || 'SLST --:--:--'}</span>
          </div>
        </div>
      </div>

      {/* Center Tagline Section */}
      <div className="relative max-w-xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono font-medium tracking-wide mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>MARITIME SURVEILLANCE</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Maritime Domain Awareness,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            in real time.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-[#8A99B3] leading-relaxed max-w-lg">
          Advanced analytics and monitoring for modern maritime operations.
        </p>
      </div>

      {/* Map Viewport Legend / Coordinates Bottom Bar */}
      <div className="relative pt-5 z-10 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8A99B3] border-t border-[#1F2A40]/60">
        
        <div className="text-xs text-[#8A99B3]/80">
          LOCAL VIEWPORT (COLOMBO): <span className="text-[#E6EDF7] font-semibold">06°56'04.2"N 079°50'38.5"E</span>
        </div>
      </div>
    </section>
  );
}
