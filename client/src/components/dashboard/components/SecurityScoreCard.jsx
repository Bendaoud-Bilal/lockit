import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function SecurityScoreCard({ security = {} }) {
  const { score = 0, pct = 0, statusText = 'Unknown', total = 0, weak = 0, reused = 0, exposed = 0 } = security;

  return (
    <div className="card score-card" aria-label="Security Score">
      <div className="score-left">
        <div className="security-score-header">
          <ShieldCheck className="shield-icon" strokeWidth={1.8} aria-hidden="true" />
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
              <ShieldCheck strokeWidth={1.8} />
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