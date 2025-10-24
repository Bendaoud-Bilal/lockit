import React from 'react';
import '../style/card-details.css';
import visibilityToggleEye from '../../../assets/icons/dashboard-icons/visibility-toggle-eye.svg';
import clipboardCopy from '../../../assets/icons/dashboard-icons/clipboard-copy.svg';
import passwordEdit from '../../../assets/icons/dashboard-icons/password-edit.svg';

export default function CardDetails({ isOpen, onClose, item }) {
  if (!isOpen) return null;

  return (
    <div className="card-details-overlay">
      <div className="card-details-container">
        <div className="card-details-header">
          <div className="details-title">
            
            <h2>{item.title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close details">
            ×
          </button>
        </div>

        <div className="card-details-content">
          {!item.passwords?.length ? (
            <div className="empty-state">
              <p>No {item.title.toLowerCase()} found</p>
            </div>
          ) : (
            item.passwords.map(pwd => (
              <div key={pwd.id} className="password-item">
                <div className="site-info">
                  <div className="site-details">
                    <div className="site-name">
                      {pwd.site}
                      {pwd.tag && (
                        <span className={`tag ${pwd.tag.variant}`}>
                          {pwd.tag.text}
                        </span>
                      )}
                    </div>
                    <div className="site-login">{pwd.login}</div>
                  </div>
                </div>

                <div className="password-actions">
                  <div className="password-field">
                    <input 
                      type="password" 
                      value={pwd.password} 
                      readOnly 
                      className="password-input"
                    />
                    <button className="toggle-visibility" aria-label="Toggle password visibility">
                     <img src={visibilityToggleEye} alt="" width="16" height="16" />
                    </button>
                  </div>
                  <button className="copy-button" aria-label="Copy password">
                    <img src={clipboardCopy} alt="" width="16" height="16" />
                  </button>
                  <button className="edit-button" aria-label="Edit password">
                    <img src={passwordEdit} alt="" width="16" height="16" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}