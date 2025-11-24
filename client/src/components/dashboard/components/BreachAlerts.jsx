import React, { useState } from 'react';
import { AlertTriangle, Check, BellOff } from 'lucide-react';
import '../style/dashboard.css';

/**
 * Displays the breach alert summary panel.
 * - Shows a refresh button that triggers a breach scan via parent callback.
 * - Lists breach items with controls to resolve or dismiss each entry.
 */
export default function BreachAlerts({
  items = [],
  onCheckBreaches,
  onToggleResolved,
  onToggleDismissed,
}) {
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Submits a breach scan request without allowing concurrent clicks.
   * - Sets a temporary loading flag before calling the parent handler.
   * - Always clears the flag once the handler promise resolves.
   */
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
          <AlertTriangle
            className="breach-title-icon"
            size={20}
            strokeWidth={1.6}
            color="#d4183d"
          />
          <h2>Data Breach Alerts</h2>
        </div>
        <button
          className="check-breaches-button"
          onClick={handleCheckBreaches}
          disabled={isChecking}
        >
          {isChecking ? 'Checking…' : 'Check for breaches'}
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

/**
 * Renders a single breach alert row with resolve and dismiss controls.
 * - Chooses contextual icon and badge styling based on alert status.
 * - Forwards user interactions to the parent callbacks.
 */
function BreachAlertItem({ item, onToggleResolved, onToggleDismissed }) {
  const isDismissed = item.status === 'dismissed';
  const isResolved = item.status === 'resolved';

  const IconComponent = isDismissed ? BellOff : isResolved ? Check : AlertTriangle;
  const iconColor = isDismissed
    ? '#9c9ca9'
    : isResolved
      ? '#2e7d32'
      : '#dc3545';

  const badgeConfig = isDismissed
    ? { text: 'Dismissed', variant: 'dismissed' }
    : isResolved
      ? { text: 'Resolved', variant: 'resolved' }
      : { text: 'Action Required', variant: 'action-required' };

  return (
    <div className={`breach-alert-item ${item.status}`}>
      <div className="breach-item-left">
        <div className={`breach-icon-circle ${item.status || 'pending'}`}>
          <IconComponent
            size={20}
            strokeWidth={1.6}
            color={iconColor}
          />
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
            {item.affected ? (
              <>
                <span className="breach-separator">•</span>
                <span className="breach-affected">
                  Affected: {item.affected}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="breach-item-actions">
        <label className="breach-checkbox-label" title="Mark as resolved">
          <input
            type="checkbox"
            className="breach-checkbox"
            checked={isResolved}
            disabled={isDismissed}
            onChange={() => onToggleResolved(item.id)}
          />
          <span className="breach-checkbox-custom" />
        </label>

        <button
          className={`breach-dismiss-button ${
            isDismissed ? 'undismiss' : 'dismiss'
          }`}
          onClick={() => onToggleDismissed(item.id)}
          title={isDismissed ? 'Restore alert' : 'Dismiss alert'}
        >
          {isDismissed ? '↩︎' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
}