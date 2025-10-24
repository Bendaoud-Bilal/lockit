import React from 'react';
import shieldUrl from '../../../assets/icons/dashboard-icons/shield.svg';

export default function SecurityScoreCard({ security = {} }) {
  const { score = 0, pct = 0, statusText = 'Unknown', total = 0, weak = 0, reused = 0, exposed = 0 } = security;

  return (
    <div className="card score-card" aria-label="Security Score">
      <div className="score-left">
        <div className="security-score-header">
          <img src={shieldUrl} className="shield-icon" alt="Shield" />
          <h2>Security Score</h2>
        </div>

        <div className="score-number">{score}</div>
      </div>

      <div className="score-right">
        <div className="progress-wrap">
          <div className="progress-line" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>

            <div className="score-sub">
            <div className="score-badge" aria-hidden="true">
              <img src={shieldUrl} alt="" />
            </div>
            <div className="progress-caption">{statusText}</div>
          </div>
          
        </div>

        <div className="metrics" aria-hidden="false">
          <div className="metric">
            <div className="metric-number">{total}</div>
            <div className="metric-label">Total Items</div>
          </div>
          <div className="metric weak">
            <div className="metric-number">{weak}</div>
            <div className="metric-label">Weak</div>
          </div>
          <div className="metric reused">
            <div className="metric-number">{reused}</div>
            <div className="metric-label">Reused</div>
          </div>
          <div className="metric exposed">
            <div className="metric-number">{exposed}</div>
            <div className="metric-label">Exposed</div>
          </div>
        </div>
      </div>
    </div>
  );
}