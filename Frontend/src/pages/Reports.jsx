import React, { useState } from 'react';
import './Reports.css';

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
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="reports-subtitle">Generate and manage surveillance reports</p>
        </div>
        <button className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export All
        </button>
      </div>

      <div className="report-stats">
        {statistics.map((stat, index) => (
          <div key={index} className="report-stat-card">
            <p className="stat-label">{stat.label}</p>
            <div className="stat-value-row">
              <h3 className="stat-value">{stat.value}</h3>
              <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : stat.change.startsWith('-') ? 'negative' : 'neutral'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="report-types-section">
        <h2>Generate New Report</h2>
        <div className="report-types-grid">
          {reportTypes.map((report) => (
            <div key={report.id} className="report-type-card" style={{ '--card-color': report.color }}>
              <div className="report-type-icon">{report.icon}</div>
              <div className="report-type-content">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <div className="report-type-footer">
                  <span className="report-count">{report.count} records</span>
                  <button className="generate-btn">
                    Generate
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-reports-section">
        <div className="section-header">
          <h2>Recent Reports</h2>
          <div className="period-selector">
            <button 
              className={selectedPeriod === 'week' ? 'period-btn active' : 'period-btn'}
              onClick={() => setSelectedPeriod('week')}
            >
              This Week
            </button>
            <button 
              className={selectedPeriod === 'month' ? 'period-btn active' : 'period-btn'}
              onClick={() => setSelectedPeriod('month')}
            >
              This Month
            </button>
            <button 
              className={selectedPeriod === 'year' ? 'period-btn active' : 'period-btn'}
              onClick={() => setSelectedPeriod('year')}
            >
              This Year
            </button>
          </div>
        </div>

        <div className="reports-table">
          <div className="table-header">
            <div className="table-col">Report Name</div>
            <div className="table-col">Type</div>
            <div className="table-col">Date</div>
            <div className="table-col">Size</div>
            <div className="table-col">Actions</div>
          </div>
          {recentReports.map((report) => (
            <div key={report.id} className="table-row">
              <div className="table-col">
                <div className="report-name">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {report.title}
                </div>
              </div>
              <div className="table-col">
                <span className="report-type-badge">{report.type}</span>
              </div>
              <div className="table-col">{report.date}</div>
              <div className="table-col">{report.size}</div>
              <div className="table-col">
                <div className="table-actions">
                  <button className="action-btn" title="View">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="action-btn" title="Download">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="action-btn" title="Share">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
