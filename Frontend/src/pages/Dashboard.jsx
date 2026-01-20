import React from 'react';

const Dashboard = () => {
  const stats = [
    { title: 'Active Vessels', value: '248', change: '+12', icon: '⚓', color: '#088395' },
    { title: 'Active Alerts', value: '7', change: '-3', icon: '⚠️', color: '#f59e0b' },
    { title: 'Zones Monitored', value: '15', change: '0', icon: '🗺️', color: '#10b981' },
    { title: 'System Status', value: '98%', change: '+2%', icon: '✓', color: '#0a4d68' },
  ];

  const recentActivity = [
    { id: 1, vessel: 'MV Ocean Star', type: 'Entry', zone: 'Zone A-1', time: '2 mins ago', status: 'normal' },
    { id: 2, vessel: 'SS Neptune', type: 'Alert', zone: 'Zone B-3', time: '15 mins ago', status: 'warning' },
    { id: 3, vessel: 'HMS Guardian', type: 'Exit', zone: 'Zone A-2', time: '32 mins ago', status: 'normal' },
    { id: 4, vessel: 'MV Atlantic', type: 'Entry', zone: 'Zone C-1', time: '1 hour ago', status: 'normal' },
    { id: 5, vessel: 'SS Pacific', type: 'Speed Alert', zone: 'Zone B-1', time: '2 hours ago', status: 'critical' },
  ];

  const vesselsByZone = [
    { zone: 'Zone A', vessels: 67, percentage: 27 },
    { zone: 'Zone B', vessels: 89, percentage: 36 },
    { zone: 'Zone C', vessels: 54, percentage: 22 },
    { zone: 'Zone D', vessels: 38, percentage: 15 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e] p-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Maritime Surveillance Dashboard</h1>
        <p className="text-lg text-gray-400">Real-time monitoring and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#1a2942] rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-gray-700" style={{ borderLeftColor: stat.color }}>
            <div className="text-4xl mb-4">{stat.icon}</div>
            <p className="text-sm text-gray-400 font-semibold mb-2">{stat.title}</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                stat.change.startsWith('+') ? 'bg-green-500/10 text-green-400' :
                stat.change.startsWith('-') ? 'bg-red-500/10 text-red-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <span className="flex items-center gap-2 text-sm font-semibold text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3 p-3 bg-[#0b1220] rounded-xl hover:bg-[#111b2e] transition-colors border border-gray-800">
                <div className={`w-1.5 rounded-full flex-shrink-0 ${
                  activity.status === 'normal' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white truncate">{activity.vessel}</span>
                    <span className="text-xs bg-[#243b78] text-blue-200 px-2 py-0.5 rounded font-semibold">{activity.type}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>{activity.zone}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Vessel Distribution</h3>
            <button className="text-xs font-semibold text-[#f28c1b] hover:text-orange-400 px-3 py-1.5 border border-[#f28c1b]/30 rounded-lg transition-colors">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {vesselsByZone.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-200">{item.zone}</span>
                  <span className="text-sm text-gray-400">{item.vessels} vessels</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 font-medium">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Surveillance Map</h3>
          <div className="flex gap-2">
            <button className="text-sm font-semibold text-gray-300 px-3 py-2 border border-gray-600 rounded-lg hover:bg-[#243b78] transition-colors">Refresh</button>
            <button className="text-sm font-semibold text-gray-300 px-3 py-2 border border-gray-600 rounded-lg hover:bg-[#243b78] transition-colors">Fullscreen</button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 bg-[#0b1220] rounded-xl border-2 border-dashed border-gray-700">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-600 mb-3">
            <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-lg font-semibold text-gray-400 mb-1">Interactive Map View</p>
          <span className="text-sm text-gray-500">Showing 248 active vessels across 15 monitored zones</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
