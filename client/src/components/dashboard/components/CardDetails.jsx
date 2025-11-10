// client/src/components/CardDetails.jsx
import React, { useEffect, useState } from 'react';
// Assuming this path is correct based on the provided structure: client/src/utils/crypto.js
import decryptAesGcmBrowser from '../../../utils/crypto.js'; 
import '../style/card-details.css';

// --- ICON IMPORTS ---
import visibilityToggleEye from '../../../assets/icons/dashboard-icons/visibility-toggle-eye.svg';
import clipboardCopy from '../../../assets/icons/dashboard-icons/clipboard-copy.svg';
import passwordEdit from '../../../assets/icons/dashboard-icons/password-edit.svg';
// Note: You must ensure 'eye-off.svg' and 'star.svg' exist in your assets folder.
import eyeOff from '../../../assets/icons/dashboard-icons/eye-off.svg'; 
import star from '../../../assets/icons/dashboard-icons/star.svg'; 

// Placeholder Icons for common elements
const GlobeIcon = ({ style }) => <span style={{...style, display: 'inline-block'}}>🌐</span>; 
const ExternalLinkIcon = ({ style }) => <span style={{...style, display: 'inline-block'}}>🔗</span>; 
const TwoFaShield = ({ className }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle'}}>
    <path d="M12 2L2 7v5c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z" />
  </svg>
);

/**
 * Helper to resolve the correct encryption fields from a credential object.
 * The backend is confirmed to use: dataEnc, dataIv, dataAuthTag.
 */
function resolveEncFields(itemObj) {
    if (!itemObj) return null;
    const ct = itemObj.dataEnc ?? itemObj.ciphertext ?? itemObj.ct ?? itemObj.data_enc;
    const iv = itemObj.dataIv ?? itemObj.iv ?? itemObj.data_iv;
    const tag = itemObj.dataAuthTag ?? itemObj.authTag ?? itemObj.tag ?? itemObj.data_auth_tag;
    if (!ct || !iv || !tag) return null;
    return { ciphertext: ct, iv, authTag: tag };
}


// --- COMPONENT NOW ACCEPTS LIST PROPS ---
export default function CardDetails({ isOpen, onClose, listItems, title }) {
  
  // State to track which passwords have been revealed and their decrypted content
  const [revealedIds, setRevealedIds] = useState({}); // { itemId: true/false }
  const [decryptedPasswords, setDecryptedPasswords] = useState({}); // { itemId: 'plain_password' }
  const [error, setError] = useState(null);
  
  const vaultKey = sessionStorage.getItem('vaultKey');

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setRevealedIds({});
      setDecryptedPasswords({});
      setError(null);
    }
  }, [isOpen]);

  
  // Decryption/Reveal logic adapted for individual items in the list
  const handleTogglePassword = async (item) => {
    setError(null);
    const itemId = item.id;
    const isRevealed = revealedIds[itemId];

    if (isRevealed) {
        // If currently revealed, hide it
        setRevealedIds(prev => ({ ...prev, [itemId]: false }));
        return;
    }
    
    // If decrypted data is already cached, just reveal
    if (decryptedPasswords[itemId]) {
        setRevealedIds(prev => ({ ...prev, [itemId]: true }));
        return;
    }

    // Decrypt and reveal
    const enc = resolveEncFields(item);
    if (!enc) {
      setError(`Credential '${item.title}' missing encryption fields.`);
      return;
    }

    if (!vaultKey) {
      setError('Vault locked. Unlock the vault to reveal the password.');
      return;
    }

    try {
      // Use the client-side decryption utility
      const plain = await decryptAesGcmBrowser(vaultKey, enc.ciphertext, enc.iv, enc.authTag);
      let parsed;
      try { parsed = JSON.parse(plain); } catch { parsed = plain; }
      
      // Attempt to extract 'password' field, fallback to raw string/JSON stringify
      const passwordToShow = (typeof parsed === 'object' && parsed.password) || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));

      setDecryptedPasswords(prev => ({ ...prev, [itemId]: passwordToShow }));
      setRevealedIds(prev => ({ ...prev, [itemId]: true }));

    } catch (err) {
      setError('Unable to decrypt one or more passwords. Ensure vault is unlocked with the correct key.');
      console.error(err);
    }
  };

  // --- UI Helpers ---

  const getStrengthStyle = (strength) => {
    const s = String(strength ?? '');
    switch (s.toLowerCase()) {
      case 'weak':
        return { backgroundColor: '#fee2e2', color: '#b91c1c' };
      case 'medium':
        return { backgroundColor: '#fef3c7', color: '#a53e05' };
      case 'strong':
        return { backgroundColor: '#d1fae5', color: '#065f46' };
      default:
        // Use a default based on score if strength is a number
        const score = Number(strength);
        if (score >= 80) return { backgroundColor: '#d1fae5', color: '#065f46' };
        if (score >= 40) return { backgroundColor: '#fef3c7', color: '#a53e05' };
        return { backgroundColor: '#fee2e2', color: '#b91c1c' };
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // In a real app, you would show a toast/notification
    alert('Password copied to clipboard!'); 
  };
  
  const handleEdit = (itemId) => {
      // Placeholder for edit action
      console.log(`Edit button clicked for item ID: ${itemId}`);
      alert(`Edit feature not yet implemented for item ID: ${itemId}`);
  };

  if (!isOpen) return null;
  const items = listItems || [];

  return (
    <div className="card-details-overlay">
      {/* Set max width and enable flex column for header/content separation */}
      <div className="card-details-container" style={{ maxWidth: '600px', height: '80%', display: 'flex', flexDirection: 'column' }}> 
        
  {/* Header shows the selected classification title */}
        <div className="card-details-header"> 
          <div className="details-title">
            <h2>{title || 'Credential Details'}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close details">
            &times;
          </button>
        </div>

        {/* Content: Scrollable List of Cards */}
        <div className="card-details-content" style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', paddingTop: 0 }}>
            {error && <div style={{ color: 'crimson', padding: '10px', margin: '1rem 0', border: '1px solid crimson', borderRadius: '8px' }}>{error}</div>}
            
            {items.length === 0 && (
                <div className="empty-state" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p>No credentials found for this classification.</p>
                </div>
            )}
            
            {items.map(item => {
                const isRevealed = revealedIds[item.id];
                const decryptedValue = decryptedPasswords[item.id];
                const passwordDisplayValue = isRevealed ? (decryptedValue || 'Decryption failed/empty') : '••••••••';
                // Simple placeholder URL generation
                const siteUrl = item.title ? `https://${item.title.toLowerCase().replace(/\s/g, '')}.com` : '#'; 
                const strength = item.passwordStrength;

                return (
                    // Individual Password Card
                    <div key={item.id} style={{ 
                        backgroundColor: '#f9fafb', 
                        borderRadius: '0.75rem', 
                        padding: '1.5rem', 
                        marginBottom: '1rem', 
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                        border: '1px solid #e5e7eb'
                    }}>
                      
                        {/* Site Info Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <div style={{ minWidth: '3rem', height: '3rem', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GlobeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#4b5563' }} />
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {/* Site Title */}
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{item.title}</h3>
                                        
                                        {/* Favorite Icon */}
                                        {item.favorite && (
                                          <img src={star} alt="Favorite" style={{ width: '1.25rem', height: '1.25rem', fill: '#f59e0b', color: '#f59e0b' }} />
                                        )}
                                        
                                        {/* 2FA Badge */}
                                        {item.has2fa && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', backgroundColor: 'white', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', color: '#374151', border: '1px solid #e5e7eb' }}>
                                                <TwoFaShield className="w-3 h-3" />
                                                2FA
                                            </span>
                                        )}
                                        
                                        {/* Strength Tag */}
                                        <span style={{ ...getStrengthStyle(strength), padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                            {strength || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    {/* Login/Category */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Category:</span>
                                        <span style={{ fontSize: '0.875rem', color: '#2563eb' }}>{item.category ?? 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* External Link Button - Placed separately for alignment */}
                            <button
                                onClick={() => window.open(siteUrl, '_blank')}
                                style={{ padding: '0.5rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.5rem', transition: 'background-color 0.15s ease', marginLeft: '1rem' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                aria-label="Go to site"
                            >
                                <ExternalLinkIcon style={{ width: '1rem', height: '1rem', color: '#4b5563' }} />
                            </button>
                        </div>

                        {/* Password Field */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', marginTop: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280', minWidth: '80px' }}>Password:</span>
                            <span style={{ fontSize: '0.875rem', color: '#111827', fontFamily: 'monospace', letterSpacing: '0.05em', flex: 1, overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                                {passwordDisplayValue}
                            </span>
                            
                            {/* Toggle Visibility Button */}
                            <button
                                onClick={() => handleTogglePassword(item)}
                                style={{ padding: '0.5rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.5rem', transition: 'background-color 0.15s ease' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                aria-label={isRevealed ? 'Hide password' : 'Reveal password'}
                            >
                                <img src={isRevealed ? eyeOff : visibilityToggleEye} alt={isRevealed ? 'Eye Off' : 'Eye'} style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                            </button>
                            
                            {/* Copy Button */}
                            <button
                                onClick={() => handleCopy(passwordDisplayValue)}
                                style={{ padding: '0.5rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.5rem', transition: 'background-color 0.15s ease' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                aria-label="Copy password"
                            >
                                <img src={clipboardCopy} alt="Copy" style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                            </button>

                            {/* EDIT Button */}
                            <button
                                onClick={() => handleEdit(item.id)}
                                style={{ padding: '0.5rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.5rem', transition: 'background-color 0.15s ease' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                aria-label="Edit password"
                            >
                                <img src={passwordEdit} alt="Edit" style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
