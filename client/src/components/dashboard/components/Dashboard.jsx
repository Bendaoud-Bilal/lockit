import '../style/dashboard.css';
import React, { useEffect, useState } from 'react';
import SecurityScoreCard from './SecurityScoreCard';
import PasswordCards from './PasswordCards';
import BreachAlerts from './BreachAlerts';
import CardDetails from './CardDetails';
import APP_CONFIG from '../../../utils/config';

export default function Dashboard() {
  const API_BASE_URL = APP_CONFIG.API_BASE_URL;
  const [security, setSecurity] = useState(null);
  const [cardsData, setCardsData] = useState(null);
  const [breachAlerts, setBreachAlerts] = useState([]);
  const [selectedCardItems, setSelectedCardItems] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const userId = sessionStorage.getItem('userId') || '1';

  useEffect(() => {
    if (!sessionStorage.getItem('userId')) {
      sessionStorage.setItem('userId', '1');
    }
    loadDashboardData();
  }, [userId]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };

      const [scoreRes, cardsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${userId}/security-score`, { headers }),
        fetch(`${API_BASE_URL}/api/users/${userId}/password-cards`, { headers }),
        fetch(`${API_BASE_URL}/api/users/${userId}/breach-alerts`, { headers }),
      ]);

      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setSecurity(scoreData);
      }
      
      if (cardsRes.ok) {
        const cardsDataRes = await cardsRes.json();
        setCardsData(cardsDataRes);
      }
      
      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setBreachAlerts(alerts);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleCheckBreaches() {
    try {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/check-breaches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Breach check complete! Found ${result.newBreaches} new breaches.`);
        
        // Reload breach alerts
  const alertsRes = await fetch(`${API_BASE_URL}/api/users/${userId}/breach-alerts`, {
          headers: { 'x-user-id': userId },
        });
        
        if (alertsRes.ok) {
          const alerts = await alertsRes.json();
          setBreachAlerts(alerts);
        }
      } else {
        alert('Failed to check for breaches. Please try again.');
      }
    } catch (error) {
      console.error('Error checking breaches:', error);
      alert('Error checking breaches. Please try again.');
    }
  }

  async function handleToggleBreachResolved(breachId) {
    try {
  const response = await fetch(`${API_BASE_URL}/api/breach-alerts/${breachId}/toggle-resolved`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const updatedBreach = await response.json();
        
        // Update local state
        setBreachAlerts(prev => 
          prev.map(b => b.id === breachId ? { ...b, status: updatedBreach.status } : b)
        );
      }
    } catch (error) {
      console.error('Error toggling breach resolved:', error);
    }
  }

  async function handleToggleBreachDismissed(breachId) {
    try {
  const response = await fetch(`${API_BASE_URL}/api/breach-alerts/${breachId}/toggle-dismissed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const updatedBreach = await response.json();
        
        // Update local state
        setBreachAlerts(prev => 
          prev.map(b => b.id === breachId ? { ...b, status: updatedBreach.status } : b)
        );
      }
    } catch (error) {
      console.error('Error toggling breach dismissed:', error);
    }
  }

  function onOpenCardHandler(cardId) {
  fetch(`${API_BASE_URL}/api/password-cards/${cardId}/details`, {
      headers: { 'x-user-id': userId },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.items) {
          const cardTitles = {
            weak: 'Weak Passwords',
            reused: 'Reused Passwords',
            exposed: 'Exposed Passwords',
            old: 'Old Passwords',
          };
          setSelectedCardItems(data.items);
          setModalTitle(cardTitles[cardId] || 'Credentials');
          setDetailsOpen(true);
        }
      })
      .catch(console.error);
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-red)' }}>
          <h2>Error loading dashboard</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <SecurityScoreCard security={security || {}} />
      
      <PasswordCards
        items={cardsData?.cards || []}
        onOpenCard={onOpenCardHandler}
      />

      <BreachAlerts 
        items={breachAlerts} 
        onCheckBreaches={handleCheckBreaches}
        onToggleResolved={handleToggleBreachResolved}
        onToggleDismissed={handleToggleBreachDismissed}
      />

      <CardDetails
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        listItems={selectedCardItems}
        title={modalTitle}
      />
    </div>
  );
}