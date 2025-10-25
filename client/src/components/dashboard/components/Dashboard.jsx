// client/src/components/Dashboard.jsx
import '../style/dashboard.css';
import React, { useEffect, useState } from 'react';
import SecurityScoreCard from './SecurityScoreCard';
import PasswordCards from './PasswordCards';
import BreachAlerts from './BreachAlerts';
import CardDetails from './CardDetails';

export default function Dashboard() {
  const [security, setSecurity] = useState(null);
  const [cardsData, setCardsData] = useState(null);
  const [breachAlerts, setBreachAlerts] = useState([]);
  
  // --- NEW STATE for List View Modal ---
  const [selectedCardItems, setSelectedCardItems] = useState(null);
  const [modalTitle, setModalTitle] = useState(null);
  // --- END NEW STATE ---
  
  // The old state for single item is now obsolete for this flow, but kept for clarity
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For development, use userId = 1
  const userId = sessionStorage.getItem('userId') || '1';

  useEffect(() => {
    // Set userId in sessionStorage if not exists
    if (!sessionStorage.getItem('userId')) {
      sessionStorage.setItem('userId', '1');
    }

    async function load() {
      try {
        setLoading(true);
        const headers = { 'x-user-id': userId };

        const [scoreRes, cardsRes, alertsRes] = await Promise.all([
          fetch(`http://localhost:4000/api/users/${userId}/security-score`, { headers }),
          fetch(`http://localhost:4000/api/users/${userId}/password-cards`, { headers }),
          fetch(`http://localhost:4000/api/users/${userId}/breach-alerts`, { headers }),
        ]);

        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          setSecurity(scoreData);
        } // ... (error handling omitted for brevity)
        
        if (cardsRes.ok) {
          const cardsDataRes = await cardsRes.json();
          setCardsData(cardsDataRes);
        } // ... (error handling omitted for brevity)
        
        if (alertsRes.ok) {
          const alerts = await alertsRes.json();
          setBreachAlerts(alerts);
        } // ... (error handling omitted for brevity)
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  /**
   * Opens the CardDetails modal with a list of credentials and a classification title.
   * @param {string} title - The classification title (e.g., "Weak Passwords").
   * @param {Array<Object>} itemsList - The array of credential objects.
   */
  function openDetails(title, itemsList) {
    setModalTitle(title);
    setSelectedCardItems(itemsList);
    // Setting selectedItemId to the first item's ID for potential CardDetails compatibility, if needed.
    setSelectedItemId(itemsList?.[0]?.id || null); 
    setDetailsOpen(true);
  }

  /**
   * Handler for when a Password Card is clicked. Fetches the detailed list 
   * of credentials for that classification.
   * @param {string} cardId - The ID of the card (e.g., 'weak', 'reused', 'exposed', 'old').
   */
  function onOpenCardHandler(cardId) {
    // 1. Find the title of the clicked card (the classification)
    const clickedCard = cardsData?.cards.find(card => card.id === cardId);
    const title = clickedCard?.title || 'Credential Details';

    // 2. Fetch the detailed list of credentials for this card/classification
    fetch(`http://localhost:4000/api/password-cards/${cardId}/details`, {
      headers: { 'x-user-id': userId },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.items) { // data.items is the array of credentials
          // 3. Open the modal with the classification title and the list of items
          openDetails(title, data.items);
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
    // ... (error JSX omitted for brevity)
  }

  return (
    <div className="container">
      <SecurityScoreCard security={security || {}} />
      
      <PasswordCards
        items={cardsData?.cards || []}
        onOpenCard={onOpenCardHandler} // Use the new handler
      />

      <BreachAlerts items={breachAlerts} />

      <CardDetails
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        listItems={selectedCardItems} // NEW PROP: Pass the list of items
        modalTitle={modalTitle}       // NEW PROP: Pass the classification title
        itemId={selectedItemId}       // Old prop, kept for compatibility
      />
    </div>
  );
}