import React, { useState } from 'react';
import './Alerts.css';

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
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <div>
          <h1>Alert Management</h1>
          <p className="alerts-subtitle">Monitor and manage security alerts</p>
        </div>
        <div className="alerts-actions">
          <button className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            System Status
          </button>
        </div>
      </div>

      <div className="alert-stats">
        <div className="alert-stat-card" onClick={() => setFilterStatus('all')}>
          <div className="alert-stat-icon all">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </div>
          <div className="alert-stat-content">
            <p>Total Alerts</p>
            <h3>{alertStats.total}</h3>
          </div>
        </div>

        <div className="alert-stat-card" onClick={() => setFilterStatus('critical')}>
          <div className="alert-stat-icon critical">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="alert-stat-content">
            <p>Critical</p>
            <h3>{alertStats.critical}</h3>
          </div>
        </div>

        <div className="alert-stat-card" onClick={() => setFilterStatus('warning')}>
          <div className="alert-stat-icon warning">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="alert-stat-content">
            <p>Warnings</p>
            <h3>{alertStats.warning}</h3>
          </div>
        </div>

        <div className="alert-stat-card" onClick={() => setFilterStatus('info')}>
          <div className="alert-stat-icon info">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="alert-stat-content">
            <p>Info</p>
            <h3>{alertStats.info}</h3>
          </div>
        </div>
      </div>

      <div className="alerts-filter">
        <div className="filter-tabs">
          <button 
            className={filterStatus === 'all' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilterStatus('all')}
          >
            All Alerts
          </button>
          <button 
            className={filterStatus === 'critical' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilterStatus('critical')}
          >
            Critical
          </button>
          <button 
            className={filterStatus === 'warning' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilterStatus('warning')}
          >
            Warnings
          </button>
          <button 
            className={filterStatus === 'info' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilterStatus('info')}
          >
            Info
          </button>
        </div>
        <button className="clear-all-btn">Clear All</button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`alert-item ${alert.type}`}>
            <div className="alert-indicator"></div>
            <div className="alert-icon-badge">{getAlertIcon(alert.type)}</div>
            <div className="alert-content">
              <div className="alert-header-row">
                <h3 className="alert-title">{alert.title}</h3>
                <span className={`alert-badge ${alert.type}`}>
                  {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                </span>
              </div>
              <p className="alert-description">{alert.description}</p>
              <div className="alert-details">
                <span className="alert-detail">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {alert.vessel}
                </span>
                <span className="alert-detail">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {alert.zone}
                </span>
                <span className="alert-detail">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {alert.time}
                </span>
              </div>
            </div>
            <div className="alert-actions">
              <button className="alert-action-btn view">View</button>
              <button className="alert-action-btn dismiss">Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
