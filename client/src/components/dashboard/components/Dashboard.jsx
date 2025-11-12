import '../style/dashboard.css';
import '../style/data-breach.css';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

  const loadDashboardData = useCallback(async ({ showSpinner = true } = {}) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const headers = { 'x-user-id': userId };

      const [scoreRes, cardsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${userId}/security-score`, { headers }),
        fetch(`${API_BASE_URL}/api/users/${userId}/password-cards`, { headers }),
        fetch(`${API_BASE_URL}/api/users/${userId}/breach-alerts`, { headers }),
      ]);

      console.log('[Dashboard] Fetch responses', {
        score: scoreRes.status,
        cards: cardsRes.status,
        alerts: alertsRes.status,
      });

      if (scoreRes.ok) setSecurity(await scoreRes.json());
      if (cardsRes.ok) setCardsData(await cardsRes.json());
      if (alertsRes.ok) setBreachAlerts(await alertsRes.json());

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [API_BASE_URL, userId]);

  useEffect(() => {
    if (!sessionStorage.getItem('userId')) {
      sessionStorage.setItem('userId', '1');
    }
    loadDashboardData().catch((err) => {
      console.error('Error loading dashboard data:', err);
    });
  }, [loadDashboardData, userId]);

  async function handleCheckBreaches() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${userId}/check-breaches`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );

      if (response.status === 429) {
        toast.error('Rate limit exceeded. Please wait before retrying.');
        return;
      }

      if (!response.ok) {
        throw new Error('failed_to_check');
      }

      const result = await response.json();
      toast.success(
        result.newBreaches > 0
          ? `Found ${result.newBreaches} new breach${result.newBreaches > 1 ? 'es' : ''}.`
          : 'No new breaches detected.'
      );

  await loadDashboardData({ showSpinner: false });
    } catch (err) {
      console.error('Error checking breaches:', err);
      toast.error('Unable to check for breaches. Please try again.');
    }
  }

  async function handleToggleBreachResolved(breachId) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/breach-alerts/${breachId}/toggle-resolved`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );
      if (!res.ok) {
        toast.error('Unable to update breach status right now.');
        return;
      }

      const updated = await res.json();
      setBreachAlerts((prev) =>
        prev.map((b) =>
          b.id === breachId ? { ...b, status: updated.status } : b
        )
      );
    } catch (err) {
      console.error('Error toggling breach resolved:', err);
      toast.error('Unable to update breach status.');
    }
  }

  async function handleToggleBreachDismissed(breachId) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/breach-alerts/${breachId}/toggle-dismissed`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );
      if (!res.ok) {
        toast.error('Unable to update breach status right now.');
        return;
      }

      const updated = await res.json();
      setBreachAlerts((prev) =>
        prev.map((b) =>
          b.id === breachId ? { ...b, status: updated.status } : b
        )
      );
    } catch (err) {
      console.error('Error toggling breach dismissed:', err);
      toast.error('Unable to update breach status.');
    }
  }

  const handleCredentialMutated = useCallback(() => {
    loadDashboardData({ showSpinner: false }).catch((err) => {
      console.error('Error refreshing dashboard data:', err);
      toast.error('Failed to refresh dashboard data.');
    });
  }, [loadDashboardData]);

  function handleOpenCard(cardId) {
    fetch(`${API_BASE_URL}/api/password-cards/${cardId}/details`, {
      headers: { 'x-user-id': userId },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.items) return;
        const cardTitles = {
          weak: 'Weak Passwords',
          reused: 'Reused Passwords',
          exposed: 'Exposed Passwords',
          old: 'Old Passwords',
        };
        setSelectedCardItems(data.items);
        setModalTitle(cardTitles[cardId] || 'Credentials');
        setDetailsOpen(true);
      })
      .catch((err) => console.error('error fetching card details', err));
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Loading dashboard…</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--color-red)',
          }}
        >
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
        onOpenCard={handleOpenCard}
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
        onRefresh={handleCredentialMutated}
      />
    </div>
  );
}