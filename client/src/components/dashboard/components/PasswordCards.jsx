import React from 'react';
import { Eye, AlertTriangle, Repeat, ShieldAlert, Clock } from 'lucide-react';
import '../style/card-details.css';

const iconMap = {
  weak: AlertTriangle,
  reused: Repeat,
  exposed: ShieldAlert,
  old: Clock,
};

/**
 * Presents the top-level password health cards used on the dashboard.
 * - Picks an icon and accent color per risk category via a lookup map.
 * - Delegates detail modal opening through the supplied callback.
 */
export default function PasswordCards({ items = [], onOpenCard = () => {} }) {
  /**
   * Shows a fallback panel when no password metrics are available.
   * - Keeps layout consistent with the surrounding card grid.
   * - Communicates the empty state with minimal markup.
   */
  const EmptyState = () => (
    <div className="empty-state">
      <p>No passwords found</p>
    </div>
  );

  if (!items || items.length === 0) return <EmptyState />;

  return (
    <div className="password-cards" role="list" aria-label="Password state cards">
      {items.map(item => {
        const IconComponent = iconMap[item.id] ?? AlertTriangle;

        return (
          <div key={item.id} className="password-card" role="listitem" aria-label={item.title}>
            <div className="password-card-header">
              <div className="password-card-info">
                <div className={`icon-circle ${item.color}`}>
                  <IconComponent size={22} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div className="password-card-title">
                  <h3>{item.title}</h3>
                </div>
              </div>
              <button
                onClick={() => onOpenCard(item.id)}
                className="eye-button"
                aria-label={`View ${item.title}`}
                type="button"
              >
                <Eye className="eye-icon" strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>

            <div className="password-card-content">
              <div className="password-count">{item.count}</div>
              {item.badge?.text && (
                <div className={`badge ${item.badge.variant}`}>
                  {item.badge.text}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


