import React from 'react';
import './Dashboard.css';

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
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Maritime Surveillance Dashboard</h1>
        <p className="dashboard-subtitle">Real-time monitoring and analytics</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ '--accent-color': stat.color }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <div className="stat-value-row">
                <h2 className="stat-value">{stat.value}</h2>
                <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : stat.change.startsWith('-') ? 'negative' : 'neutral'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <span className="live-indicator">
              <span className="pulse"></span>
              Live
            </span>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-status ${activity.status}`}></div>
                <div className="activity-details">
                  <div className="activity-main">
                    <span className="activity-vessel">{activity.vessel}</span>
                    <span className="activity-type">{activity.type}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-zone">{activity.zone}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Vessel Distribution</h3>
            <button className="card-action">View All</button>
          </div>
          <div className="distribution-chart">
            {vesselsByZone.map((item, index) => (
              <div key={index} className="distribution-item">
                <div className="distribution-info">
                  <span className="distribution-zone">{item.zone}</span>
                  <span className="distribution-count">{item.vessels} vessels</span>
                </div>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="distribution-percentage">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card map-card">
        <div className="card-header">
          <h3>Surveillance Map</h3>
          <div className="map-controls">
            <button className="map-btn">Refresh</button>
            <button className="map-btn">Fullscreen</button>
          </div>
        </div>
        <div className="map-placeholder">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Interactive Map View</p>
          <span>Showing 248 active vessels across 15 monitored zones</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
