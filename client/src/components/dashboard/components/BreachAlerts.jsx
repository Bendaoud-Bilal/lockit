import React from 'react';
import breachTriUrl from '../../../assets/icons/dashboard-icons/breach-triangle.svg';
import breachCheckUrl from '../../../assets/icons/dashboard-icons/breach-check.svg';
import refreshUrl from '../../../assets/icons/dashboard-icons/refresh.svg';

export default function BreachAlerts({ items = [] }) {
  return (
    <div className="card" aria-label="Data Breach Alerts">
      <div className="breach-header">
        <div className="breach-title">
          <img src={breachTriUrl} width="20" height="20" alt="" />
          <h2>Data Breach Alerts</h2>
        </div>

        <div className="check-button" role="button" tabIndex={0} aria-label="Check for breaches">
          <img src={refreshUrl} width="16" height="16" alt="Refresh" />
          <div>Check for breaches</div>
        </div>
      </div>

      <div className="breach-list">
        {items.map(b => (
          <div key={b.id} className="breach-item">
            <div className={`breach-icon ${b.status === 'resolved' ? 'green' : 'red'}`}>
              <img src={b.status === 'resolved' ? breachCheckUrl : breachTriUrl} width="24" height="24" alt="" />
            </div>

            <div className="breach-content">
              <div className="breach-service">
                <h3>{b.service}</h3>
                <span className={`badge ${b.status === 'resolved' ? 'resolved' : 'action-required'}`}>
                  {b.status === 'resolved' ? 'Resolved' : 'Action Required'}
                </span>
              </div>
              <div className="breach-description">{b.description}</div>
              <div className="breach-details">Breach Date: {b.date} • Affected: {b.affected}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}