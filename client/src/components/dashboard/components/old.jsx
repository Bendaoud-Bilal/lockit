import React from 'react';
import '../style/dashboard.css';
import {
  ShieldCheck,
  Eye,
  AlertTriangle,
  Repeat,
  ShieldAlert,
  Clock,
  RefreshCcw,
  CheckCircle,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="container">
      {/* Security Score Card */}
      <div className="card score-card">
        <div className="score-left">
          <div className="security-score-header">
            <ShieldCheck className="shield-icon" strokeWidth={1.8} aria-hidden="true" />
            <h2>Security Score</h2>
          </div>

          <div className="score-number">63</div>

          
        </div>

        <div className="score-right">
          <div className="progress-wrap">
            <div className="progress-line" aria-hidden="true">
              <div className="progress-fill" style={{ width: '75%' }} />
            </div>
            <div className="score-sub">
            <div className="score-badge" aria-hidden="true">
              <ShieldCheck strokeWidth={1.8} />
            </div>
            <div>Good security</div>
          </div>
          </div>

          <div className="metrics">
            <div className="metric">
              <div className="metric-number">4</div>
              <div className="metric-label">Total Items</div>
            </div>

            <div className="metric weak">
              <div className="metric-number">1</div>
              <div className="metric-label">Weak</div>
            </div>

            <div className="metric reused">
              <div className="metric-number">1</div>
              <div className="metric-label">Reused</div>
            </div>

            <div className="metric">
              <div className="metric-number">0</div>
              <div className="metric-label">Exposed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Cards Row */}
      <div className="password-cards">
        {/* Weak */}
        <div className="password-card">
          <div className="password-card-header">
            <div className="password-card-info">
              <div className="icon-circle red">
                <AlertTriangle size={22} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="password-card-title">
                <h3>Weak Passwords</h3>
              </div>
            </div>
            <Eye className="eye-icon" strokeWidth={1.6} aria-hidden="true" />
          </div>

          <div className="password-card-content">
            <div className="password-count">1</div>
            <div className="badge action-needed">Action needed</div>
          </div>
        </div>

        {/* Reused */}
        <div className="password-card">
          <div className="password-card-header">
            <div className="password-card-info">
              <div className="icon-circle yellow">
                <Repeat size={22} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="password-card-title">
                <h3>Reused Passwords</h3>
              </div>
            </div>
            <Eye className="eye-icon" strokeWidth={1.6} aria-hidden="true" />
          </div>

          <div className="password-card-content">
            <div className="password-count">1</div>
            <div className="badge review">Review</div>
          </div>
        </div>

        {/* Exposed */}
        <div className="password-card">
          <div className="password-card-header">
            <div className="password-card-info">
              <div className="icon-circle orange">
                <ShieldAlert size={22} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="password-card-title">
                <h3>Exposed Passwords</h3>
              </div>
            </div>
            <Eye className="eye-icon" strokeWidth={1.6} aria-hidden="true" />
          </div>

          <div className="password-card-content">
            <div className="password-count">0</div>
          </div>
        </div>

        {/* Old */}
        <div className="password-card">
          <div className="password-card-header">
            <div className="password-card-info">
              <div className="icon-circle blue">
                <Clock size={22} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="password-card-title">
                <h3>Old Passwords</h3>
              </div>
            </div>
          </div>

          <div className="password-card-content">
            <div className="password-count">4</div>
            <div className="badge update">Update</div>
          </div>
        </div>
      </div>

      {/* Data Breach Alerts Card */}
      <div className="card">
        <div className="breach-header">
          <div className="breach-title">
            <AlertTriangle size={20} strokeWidth={1.6} aria-hidden="true" />
            <h2>Data Breach Alerts</h2>
          </div>

          <div className="check-button">
            <RefreshCcw size={16} strokeWidth={1.6} aria-hidden="true" />
            <div>Check for breaches</div>
          </div>
        </div>

        <div className="breach-list">
          <div className="breach-item">
            <div className="breach-icon red">
              <AlertTriangle size={24} strokeWidth={1.6} aria-hidden="true" />
            </div>

            <div className="breach-content">
              <div className="breach-service">
                <h3>LinkedIn</h3>
                <span className="badge action-required">Action Required</span>
              </div>
              <div className="breach-description">700 million user records exposed including emails and passwords</div>
              <div className="breach-details">Breach Date: 1/15/2024 • Affected: john.doe@gmail.com</div>
            </div>
          </div>

          <div className="breach-item">
            <div className="breach-icon green">
              <CheckCircle size={24} strokeWidth={1.6} aria-hidden="true" />
            </div>

            <div className="breach-content">
              <div className="breach-service">
                <h3>Adobe</h3>
                <span className="badge resolved">Resolved</span>
              </div>
              <div className="breach-description">Security breach affecting 38 million users</div>
              <div className="breach-details">Breach Date: 12/10/2023 • Affected: johndoe@work.com</div>
            </div>
          </div>
        </div>
      </div>
      <p>this is prof of auto update</p>
    </div>
  );
}

