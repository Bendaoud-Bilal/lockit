import React, { useEffect, useMemo, useState } from 'react';
import PasswordCard from '../../vault/PasswordCard';
import '../style/card-details.css';

const noop = () => {};

export default function CardDetails({ isOpen, onClose, listItems, title, onRefresh = noop }) {
    const [itemsState, setItemsState] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setItemsState(Array.isArray(listItems) ? listItems : []);
        } else {
            setItemsState([]);
        }
    }, [isOpen, listItems]);

    const normalizedItems = useMemo(
        () => itemsState.map((item) => ({ ...item, attachments: item.attachments ?? [], folder: item.folder ?? null })),
        [itemsState]
    );
    const hasItems = normalizedItems.length > 0;

    if (!isOpen) return null;

    return (
        <div className="card-details-overlay">
            <div
                className="card-details-container"
                style={{
                    maxWidth: '600px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div className="card-details-header">
                    <div className="details-title">
                        <h2>{title || 'Credential Details'}</h2>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close details">
                        &times;
                    </button>
                </div>

                <div
                    className="card-details-content"
                    style={{
                        padding: '1.5rem',
                        paddingTop: 0,
                        overflowY: hasItems && normalizedItems.length > 3 ? 'auto' : 'visible',
                        flex: hasItems && normalizedItems.length > 3 ? '1 1 auto' : '0 0 auto',
                    }}
                >
                    {!hasItems && (
                        <div className="empty-state" style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p>No credentials found for this classification.</p>
                        </div>
                    )}

                      {hasItems &&
                                    normalizedItems.map((credential) => (
                                        <div key={credential.id} className="card-details-password-shell">
                                            <PasswordCard
                                                credential={credential}
                                                onCredentialDeleted={() => {
                                                    setItemsState((prev) => prev.filter((item) => item.id !== credential.id));
                                                    onRefresh();
                                                }}
                                                onCredentialUpdated={onRefresh}
                                            />
                                        </div>
                                    ))}
                </div>
            </div>
        </div>
    );
}
