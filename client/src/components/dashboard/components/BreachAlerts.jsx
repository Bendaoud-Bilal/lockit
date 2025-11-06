import React, { useState } from 'react';
import breachTriangleUrl from '../../../assets/icons/dashboard-icons/breach-triangle.svg';
import breachCheckUrl from '../../../assets/icons/dashboard-icons/breach-check.svg';
import '../style/dashboard.css';

export default function BreachAlerts({ items = [], onCheckBreaches, onToggleResolved, onToggleDismissed }) {
  const [isChecking, setIsChecking] = useState(false);

  async function handleCheckBreaches() {
    if (isChecking) return;
    setIsChecking(true);
    try {
      await onCheckBreaches();
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="card breach-alerts-card">
      <div className="breach-alerts-header">
        <div className="breach-alerts-title">
          <img src={breachTriangleUrl} className="breach-title-icon" alt="" />
          <h2>Data Breach Alerts</h2>
        </div>
        <button 
          className="check-breaches-button" 
          onClick={handleCheckBreaches}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Check for breaches'}
        </button>
      </div>

      <div className="breach-alerts-list">
        {items.length === 0 ? (
          <div className="breach-empty-state">
            <p>No breach alerts. Your accounts are secure! 🎉</p>
          </div>
        ) : (
          items.map((item) => (
            <BreachAlertItem 
              key={item.id} 
              item={item} 
              onToggleResolved={onToggleResolved}
              onToggleDismissed={onToggleDismissed}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BreachAlertItem({ item, onToggleResolved, onToggleDismissed }) {
  const isDismissed = item.status === 'dismissed';
  const isResolved = item.status === 'resolved';
  const isPending = item.status === 'pending';

  // Determine icon and badge based on status
  const icon = isDismissed 
    ? '🔕' // Muted bell for dismissed
    : isResolved 
      ? breachCheckUrl // Green checkmark for resolved
      : breachTriangleUrl; // Red warning for pending

  const badgeConfig = isDismissed
    ? { text: 'Dismissed', variant: 'dismissed' }
    : isResolved
      ? { text: 'Resolved', variant: 'resolved' }
      : { text: 'Action Required', variant: 'action-required' };

  return (
    <div className={`breach-alert-item ${item.status}`}>
      <div className="breach-item-left">
        <div className={`breach-icon-circle ${item.status}`}>
          {typeof icon === 'string' && icon.startsWith('http') ? (
            <img src={icon} width="20" height="20" alt="" />
          ) : (
            <span className="breach-emoji-icon">{icon}</span>
          )}
        </div>
        <div className="breach-item-content">
          <div className="breach-item-header">
            <h4>{item.service}</h4>
            <span className={`badge ${badgeConfig.variant}`}>
              {badgeConfig.text}
            </span>
          </div>
          <p className="breach-description">{item.description}</p>
          <div className="breach-item-meta">
            <span className="breach-date">Breach date: {item.date}</span>
            {item.affected && (
              <>
                <span className="breach-separator">•</span>
                <span className="breach-affected">Affected: {item.affected}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="breach-item-actions">
        {/* Checkbox for resolved status */}
        <label className="breach-checkbox-label">
          <input
            type="checkbox"
            checked={isResolved}
            onChange={() => onToggleResolved(item.id)}
            disabled={isDismissed}
            className="breach-checkbox"
          />
          <span className="breach-checkbox-custom"></span>
        </label>

        {/* Dismiss/Undismiss Button */}
        <button
          className={`breach-dismiss-button ${isDismissed ? 'undismiss' : 'dismiss'}`}
          onClick={() => onToggleDismissed(item.id)}
          title={isDismissed ? 'Restore alert' : 'Dismiss alert'}
        >
          {isDismissed ? '↩️' : '🚫'}
        </button>
      </div>
    </div>
  );
}