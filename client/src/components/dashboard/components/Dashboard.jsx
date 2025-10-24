
import React from 'react';
import '../style/dashboard.css';

import SecurityScoreCard from './SecurityScoreCard';
import PasswordCards from './PasswordCards';
import BreachAlerts from './BreachAlerts';

export default function Dashboard() {
  // sample data can be replaced with real props or fetched data later
  const security = { score: 63, pct: 75, statusText: 'Good security', total: 4, weak: 1, reused: 1, exposed: 0 };

const passwordCards = [
  {
    id: 'weak',
    title: 'Weak Passwords',
    color: 'red',
    count: 1,
    badge: { text: 'Action needed', variant: 'action-needed' },
    passwords: [
      {
        id: 1,
        site: 'LinkedIn',
        icon: '/src/assets/icons/sites/linkedin.svg',
        login: 'Work',
        password: '********',
        tag: { text: 'Weak', variant: 'weak' }
      }
    ]
  },
  {
    id: 'reused',
    title: 'Reused Passwords',
    color: 'yellow',
    count: 1,
    badge: { text: 'Review', variant: 'review' },
    passwords: [
      {
        id: 2,
        site: 'Github',
        icon: '/src/assets/icons/sites/github.svg',
        login: 'Login',
        password: '********',
        tag: { text: '2FA', variant: 'strong' }
      }
    ]
  },
  {
    id: 'exposed',
    title: 'Exposed Passwords',
    color: 'orange',
    count: 0,
    passwords: []
  },
  {
    id: 'old',
    title: 'Old Passwords',
    color: 'blue',
    count: 1,
    badge: { text: 'Update', variant: 'update' },
    passwords: [
      {
        id: 3,
        site: 'Facebook',
        icon: '/src/assets/icons/sites/facebook.svg',
        login: 'Login',
        password: 'qqqqqqq',
        tag: { text: 'good', variant: 'good' }
      }
    ]
  }
];

  const breaches = [
    { id: 1, service: 'LinkedIn', status: 'action', description: '700 million user records exposed including emails and passwords', date: '1/15/2024', affected: 'john.doe@gmail.com' },
    { id: 2, service: 'Adobe', status: 'resolved', description: 'Security breach affecting 38 million users', date: '12/10/2023', affected: 'johndoe@work.com' },

  ];

  return (
    <div className="container">
      <SecurityScoreCard security={security} />
      <PasswordCards items={passwordCards} />
      <BreachAlerts items={breaches} />
      <p>auto update</p>
    </div>
  );
}