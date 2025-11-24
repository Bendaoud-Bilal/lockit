import '../style/dashboard.css';
import '../style/data-breach.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SecurityScoreCard from './SecurityScoreCard';
import PasswordCards from './PasswordCards';
import BreachAlerts from './BreachAlerts';
import CardDetails from './CardDetails';
import apiService from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import { subscribeToCredentialMutations } from '../../../utils/credentialEvents';

/**
 * Orchestrates the dashboard experience for the authenticated user.
 * - Loads security score, password risk cards, and breach alerts from the API.
 * - Subscribes to credential mutation events to refresh data in real time.
 */
export default function Dashboard() {
  const [security, setSecurity] = useState(null);
  const [cardsData, setCardsData] = useState(null);
  const [breachAlerts, setBreachAlerts] = useState([]);
  const [selectedCardItems, setSelectedCardItems] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useAuth();

  const userId = useMemo(() => {
    if (user?.id) return user.id;
    try {
      const stored = sessionStorage.getItem('lockit_user_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) return parsed.id;
      }
    } catch (parseError) {
      console.warn('Failed to restore user from sessionStorage', parseError);
    }
    return null;
  }, [user]);

  /**
   * Builds request headers for API calls when session data is restored client-side.
   * - Supplies the user identifier header when the auth context is unavailable.
   * - Returns undefined so axios keeps default headers when not needed.
   */
  const buildRequestConfig = useCallback(() => {
    if (!userId || isAuthenticated) return undefined;
    return { headers: { 'x-user-id': userId.toString() } };
  }, [isAuthenticated, userId]);

  /**
   * Pulls dashboard resources from the backend and stores them locally.
   * - Fetches security score, password cards, and breach alerts in parallel.
   * - Handles loading and error state transitions around the API calls.
   */
  const loadDashboardData = useCallback(async ({ showSpinner = true } = {}) => {
    if (!userId) {
      setSecurity(null);
      setCardsData(null);
      setBreachAlerts([]);
      setError('Please log in to view your dashboard metrics.');
      setLoading(false);
      return;
    }

    try {
      if (showSpinner) {
        setLoading(true);
      }
      const config = buildRequestConfig();

      const [scoreRes, cardsRes, alertsRes] = await Promise.all([
        apiService.axiosInstance.get(`/api/users/${userId}/security-score`, config),
        apiService.axiosInstance.get(`/api/users/${userId}/password-cards`, config),
        apiService.axiosInstance.get(`/api/users/${userId}/breach-alerts`, config),
      ]);

      setSecurity(scoreRes);
      setCardsData(cardsRes);
      setBreachAlerts(alertsRes);

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [buildRequestConfig, userId]);

  useEffect(() => {
    loadDashboardData().catch((err) => {
      console.error('Error loading dashboard data:', err);
    });
  }, [loadDashboardData]);

  /**
   * Initiates a breach scan for the user through the backend service.
   * - Shows toast feedback based on whether new breaches were discovered.
   * - Refreshes dashboard data without resetting the main loading spinner.
   */
  async function handleCheckBreaches() {
    if (!userId) {
      toast.error('User not available. Please log in again.');
      return;
    }
    try {
      const config = buildRequestConfig();
      const result = await apiService.axiosInstance.post(
        `/api/users/${userId}/check-breaches`,
        {},
        config
      );
      toast.success(
        result.newBreaches > 0
          ? `Found ${result.newBreaches} new breach${result.newBreaches > 1 ? 'es' : ''}.`
          : 'No new breaches detected.'
      );

      await loadDashboardData({ showSpinner: false });
    } catch (err) {
      console.error('Error checking breaches:', err);
      if (err?.message?.includes('429') || err?.message?.toLowerCase().includes('rate')) {
        toast.error('Rate limit exceeded. Please wait before retrying.');
        return;
      }
      toast.error(err?.message || 'Unable to check for breaches. Please try again.');
    }
  }

  /**
   * Switches a breach alert between pending and resolved states.
   * - Sends the toggle request to the backend before mutating local state.
   * - Mirrors the response status onto the cached alert collection.
   */
  async function handleToggleBreachResolved(breachId) {
    if (!userId) return;
    try {
      const config = buildRequestConfig();
      const updated = await apiService.axiosInstance.patch(
        `/api/breach-alerts/${breachId}/toggle-resolved`,
        {},
        config
      );

      setBreachAlerts((prev) =>
        prev.map((b) =>
          b.id === breachId ? { ...b, status: updated.status } : b
        )
      );
    } catch (err) {
      console.error('Error toggling breach resolved:', err);
      toast.error(err?.message || 'Unable to update breach status.');
    }
  }

  /**
   * Toggles the dismissed flag for a breach alert.
   * - Sends the request to the backend and syncs the returned status locally.
   * - Leaves other alert properties untouched to avoid refetching.
   */
  async function handleToggleBreachDismissed(breachId) {
    if (!userId) return;
    try {
      const config = buildRequestConfig();
      const updated = await apiService.axiosInstance.patch(
        `/api/breach-alerts/${breachId}/toggle-dismissed`,
        {},
        config
      );

      setBreachAlerts((prev) =>
        prev.map((b) =>
          b.id === breachId ? { ...b, status: updated.status } : b
        )
      );
    } catch (err) {
      console.error('Error toggling breach dismissed:', err);
      toast.error(err?.message || 'Unable to update breach status.');
    }
  }

  /**
   * Retrieves the credential list for the selected risk card.
   * - Reuses the API service instance to respect interceptors and headers.
   * - Returns the axios payload so callers can decide how to use the data.
   */
  const fetchCardDetails = useCallback(async (cardId) => {
    if (!userId) return null;
    const config = buildRequestConfig();
    return apiService.axiosInstance.get(`/api/password-cards/${cardId}/details`, config);
  }, [buildRequestConfig, userId]);

  /**
   * Refreshes dashboard datasets in response to credential mutations.
   * - Re-runs the summary fetches without showing the primary spinner.
   * - Updates the open details modal when present to keep contents current.
   */
  const handleCredentialMutated = useCallback(() => {
    loadDashboardData({ showSpinner: false }).catch((err) => {
      console.error('Error refreshing dashboard data:', err);
      toast.error('Failed to refresh dashboard data.');
    });

    if (detailsOpen && selectedCardId) {
      fetchCardDetails(selectedCardId)
        .then((data) => {
          if (!data || !data.items) return;
          setSelectedCardItems(data.items);
        })
        .catch((err) => console.error('Error refreshing card details:', err));
    }
  }, [detailsOpen, fetchCardDetails, loadDashboardData, selectedCardId]);

  function handleOpenCard(cardId) {
    if (!userId) {
      toast.error('User not available.');
      return;
    }

    fetchCardDetails(cardId)
      .then((data) => {
        if (!data || !data.items) return;
        const cardTitles = {
          weak: 'Weak Passwords',
          reused: 'Reused Passwords',
          exposed: 'Exposed Passwords',
          old: 'Old Passwords',
        };
        setSelectedCardId(cardId);
        setSelectedCardItems(data.items);
        setModalTitle(cardTitles[cardId] || 'Credentials');
        setDetailsOpen(true);
      })
      .catch((err) => console.error('error fetching card details', err));
  }

  useEffect(() => {
    const unsubscribe = subscribeToCredentialMutations(() => {
      handleCredentialMutated();
    });
    return unsubscribe;
  }, [handleCredentialMutated]);

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
          {userId && <button onClick={loadDashboardData}>Retry</button>}
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
  /**
   * Opens the card details modal and loads its credential list.
   * - Maps the card identifier to a readable title for the modal header.
   * - Persists the selected id for subsequent refresh operations.
   */
        onCheckBreaches={handleCheckBreaches}
        onToggleResolved={handleToggleBreachResolved}
        onToggleDismissed={handleToggleBreachDismissed}
      />

      <CardDetails
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedCardId(null);
          setSelectedCardItems(null);
        }}
        listItems={selectedCardItems}
        title={modalTitle}
        onRefresh={handleCredentialMutated}
      />
    </div>
  );
}