import React, { useState } from 'react';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const reportTypes = [
    {
      id: 1,
      title: 'Vessel Activity Report',
      description: 'Comprehensive analysis of all vessel movements and activities',
      icon: '⚓',
      count: 248,
      color: '#088395'
    },
    {
      id: 2,
      title: 'Security Incidents',
      description: 'Detailed report of all security-related incidents and alerts',
      icon: '🚨',
      count: 23,
      color: '#ef4444'
    },
    {
      id: 3,
      title: 'Zone Analysis',
      description: 'Traffic patterns and statistics for each monitored zone',
      icon: '🗺️',
      count: 15,
      color: '#10b981'
    },
    {
      id: 4,
      title: 'Compliance Report',
      description: 'Regulatory compliance status and violations',
      icon: '📋',
      count: 12,
      color: '#f59e0b'
    },
  ];

  const recentReports = [
    {
      id: 1,
      title: 'Weekly Surveillance Summary',
      type: 'Activity Report',
      date: 'Jan 18, 2026',
      size: '2.4 MB',
      status: 'completed'
    },
    {
      id: 2,
      title: 'Monthly Security Analysis',
      type: 'Security Report',
      date: 'Jan 15, 2026',
      size: '5.1 MB',
      status: 'completed'
    },
    {
      id: 3,
      title: 'Zone B Traffic Patterns',
      type: 'Zone Analysis',
      date: 'Jan 14, 2026',
      size: '1.8 MB',
      status: 'completed'
    },
    {
      id: 4,
      title: 'Compliance Audit Q1 2026',
      type: 'Compliance Report',
      date: 'Jan 10, 2026',
      size: '3.2 MB',
      status: 'completed'
    },
    {
      id: 5,
      title: 'Incident Response Summary',
      type: 'Security Report',
      date: 'Jan 8, 2026',
      size: '1.5 MB',
      status: 'completed'
    },
  ];

  const statistics = [
    { label: 'Total Reports Generated', value: '1,247', change: '+12%' },
    { label: 'Active Monitoring Hours', value: '8,760', change: '100%' },
    { label: 'Incidents Documented', value: '156', change: '-8%' },
    { label: 'Compliance Score', value: '94%', change: '+3%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e] p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Generate and manage surveillance reports</p>
        </div>
        <button className="flex items-center gap-2 bg-[#f28c1b] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export All
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statistics.map((stat, index) => (
          <div key={index} className="bg-[#1a2942] border border-gray-700 rounded-lg p-5 hover:shadow-lg transition-shadow duration-200">
            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-400' : stat.change.startsWith('-') ? 'text-red-400' : 'text-gray-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Generate New Report Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <div key={report.id} className="bg-[#1a2942] border-l-4 border-gray-600 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1" style={{ borderLeftColor: report.color }}>
              <div className="text-4xl mb-3">{report.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{report.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{report.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{report.count} records</span>
                <button className="flex items-center gap-1 text-[#f28c1b] hover:text-orange-300 font-semibold transition-colors duration-200">
                  Generate
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports Section */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Recent Reports</h2>
          <div className="flex gap-2">
            <button 
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${selectedPeriod === 'week' ? 'bg-[#f28c1b] text-white' : 'bg-[#1a2942] text-gray-400 hover:bg-[#253659]'}`}
              onClick={() => setSelectedPeriod('week')}
            >
              This Week
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${selectedPeriod === 'month' ? 'bg-[#f28c1b] text-white' : 'bg-[#1a2942] text-gray-400 hover:bg-[#253659]'}`}
              onClick={() => setSelectedPeriod('month')}
            >
              This Month
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${selectedPeriod === 'year' ? 'bg-[#f28c1b] text-white' : 'bg-[#1a2942] text-gray-400 hover:bg-[#253659]'}`}
              onClick={() => setSelectedPeriod('year')}
            >
              This Year
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-[#1a2942] border border-gray-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 bg-[#0b1220] p-4 border-b border-gray-700">
            <div className="col-span-4 text-gray-400 font-semibold text-sm">Report Name</div>
            <div className="col-span-2 text-gray-400 font-semibold text-sm">Type</div>
            <div className="col-span-2 text-gray-400 font-semibold text-sm">Date</div>
            <div className="col-span-2 text-gray-400 font-semibold text-sm">Size</div>
            <div className="col-span-2 text-gray-400 font-semibold text-sm">Actions</div>
          </div>
          {recentReports.map((report) => (
            <div key={report.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 hover:bg-[#253659] transition-colors duration-200 last:border-b-0">
              <div className="col-span-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-white text-sm">{report.title}</span>
              </div>
              <div className="col-span-2">
                <span className="bg-[#243b78] text-[#88b0ff] px-2 py-1 rounded text-xs font-medium">{report.type}</span>
              </div>
              <div className="col-span-2 text-gray-400 text-sm">{report.date}</div>
              <div className="col-span-2 text-gray-400 text-sm">{report.size}</div>
              <div className="col-span-2 flex gap-2">
                <button className="p-1.5 text-gray-400 hover:text-[#f28c1b] transition-colors duration-200" title="View">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-1.5 text-gray-400 hover:text-[#f28c1b] transition-colors duration-200" title="Download">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-1.5 text-gray-400 hover:text-[#f28c1b] transition-colors duration-200" title="Share">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
