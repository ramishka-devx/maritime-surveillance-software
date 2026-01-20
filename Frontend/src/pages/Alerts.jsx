import React, { useState } from 'react';

const Alerts = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const alerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Unauthorized Vessel Entry',
      vessel: 'Unknown Vessel #2847',
      zone: 'Restricted Zone A-5',
      time: '5 mins ago',
      description: 'Unidentified vessel detected in restricted maritime zone',
      coordinates: '47.6062°N, 122.3321°W'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Speed Limit Violation',
      vessel: 'MV Pacific Star',
      zone: 'Zone B-3',
      time: '12 mins ago',
      description: 'Vessel exceeding speed limit of 15 knots (current: 22 knots)',
      coordinates: '48.7519°N, 123.1189°W'
    },
    {
      id: 3,
      type: 'critical',
      title: 'AIS Signal Lost',
      vessel: 'SS Atlantic Trader',
      zone: 'Zone C-1',
      time: '28 mins ago',
      description: 'Vessel AIS transponder signal lost for over 20 minutes',
      coordinates: '46.2010°N, 124.1040°W'
    },
    {
      id: 4,
      type: 'info',
      title: 'Route Deviation',
      vessel: 'HMS Navigator',
      zone: 'Zone A-2',
      time: '45 mins ago',
      description: 'Vessel deviated from registered route by 2.5 nautical miles',
      coordinates: '47.9031°N, 122.7987°W'
    },
    {
      id: 5,
      type: 'warning',
      title: 'Weather Alert',
      vessel: 'Multiple Vessels',
      zone: 'Zone B-1 to B-4',
      time: '1 hour ago',
      description: 'Severe weather warning issued for zones B-1 through B-4',
      coordinates: '48.5151°N, 123.0868°W'
    },
    {
      id: 6,
      type: 'info',
      title: 'Maintenance Notice',
      vessel: 'MV Ocean Guardian',
      zone: 'Port Zone',
      time: '2 hours ago',
      description: 'Vessel anchored for scheduled maintenance',
      coordinates: '47.6062°N, 122.3321°W'
    },
    {
      id: 7,
      type: 'critical',
      title: 'Collision Risk',
      vessel: 'MV Northern Light & SS Sea Breeze',
      zone: 'Zone A-3',
      time: '3 hours ago',
      description: 'High collision risk detected between two vessels',
      coordinates: '47.7511°N, 122.4421°W'
    },
  ];

  const filteredAlerts = filterStatus === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filterStatus);

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'critical': return 'border-l-red-500 bg-red-500/10';
      case 'warning': return 'border-l-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-l-blue-500 bg-blue-500/10';
      default: return 'border-l-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e] p-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Alert Management</h1>
        <p className="text-lg text-gray-400">Monitor and manage security alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700 cursor-pointer hover:bg-[#253659] transition-colors" onClick={() => setFilterStatus('all')}>
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-semibold mb-1">Total Alerts</p>
            <h3 className="text-3xl font-bold text-white">{alertStats.total}</h3>
          </div>
        </div>

        <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700 cursor-pointer hover:bg-[#253659] transition-colors" onClick={() => setFilterStatus('critical')}>
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-semibold mb-1">Critical</p>
            <h3 className="text-3xl font-bold text-white">{alertStats.critical}</h3>
          </div>
        </div>

        <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700 cursor-pointer hover:bg-[#253659] transition-colors" onClick={() => setFilterStatus('warning')}>
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-semibold mb-1">Warnings</p>
            <h3 className="text-3xl font-bold text-white">{alertStats.warning}</h3>
          </div>
        </div>

        <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700 cursor-pointer hover:bg-[#253659] transition-colors" onClick={() => setFilterStatus('info')}>
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-semibold mb-1">Info</p>
            <h3 className="text-3xl font-bold text-white">{alertStats.info}</h3>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 bg-[#1a2942] p-1 rounded-lg border border-gray-700">
          <button 
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
              filterStatus === 'all' ? 'bg-[#f28c1b] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#253659]'
            }`}
            onClick={() => setFilterStatus('all')}
          >
            All Alerts
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
              filterStatus === 'critical' ? 'bg-[#f28c1b] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#253659]'
            }`}
            onClick={() => setFilterStatus('critical')}
          >
            Critical
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
              filterStatus === 'warning' ? 'bg-[#f28c1b] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#253659]'
            }`}
            onClick={() => setFilterStatus('warning')}
          >
            Warnings
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
              filterStatus === 'info' ? 'bg-[#f28c1b] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#253659]'
            }`}
            onClick={() => setFilterStatus('info')}
          >
            Info
          </button>
        </div>
        <button className="text-gray-400 hover:text-white text-sm font-semibold transition-colors" onClick={() => setFilterStatus('all')}>Reset Filter</button>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`bg-[#1a2942] border-l-4 rounded-xl p-6 transition-all hover:shadow-lg border-gray-700 ${getAlertColor(alert.type)}`}>
            <div className="flex gap-5">
              <div className="text-3xl flex-shrink-0 pt-1">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white text-lg">{alert.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      alert.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                      alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {alert.type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 font-medium">{alert.time}</span>
                </div>
                <p className="text-gray-300 mb-4">{alert.description}</p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-semibold text-gray-200">{alert.vessel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-semibold text-gray-200">{alert.zone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{alert.coordinates}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="px-4 py-2 bg-[#243b78] hover:bg-[#2d4a96] text-blue-100 rounded-lg text-sm font-semibold transition-colors">View</button>
                <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-semibold transition-colors">Dismiss</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
