// client/src/components/PasswordCards.jsx
import React from 'react';
import eyeUrl from '../../../assets/icons/dashboard-icons/eye.svg';
import iconWeakUrl from '../../../assets/icons/dashboard-icons/icon-weak.svg';
import iconReusedUrl from '../../../assets/icons/dashboard-icons/icon-reused.svg';
import iconExposedUrl from '../../../assets/icons/dashboard-icons/icon-exposed.svg';
import iconOldUrl from '../../../assets/icons/dashboard-icons/icon-old.svg';
import '../style/card-details.css'; // adjust path if needed

const iconMap = {
  weak: iconWeakUrl,
  reused: iconReusedUrl,
  exposed: iconExposedUrl,
  old: iconOldUrl,
};

export default function PasswordCards({ items = [], onOpenCard = () => {} }) {
  // Empty state message component
  const EmptyState = () => (
    <div className="empty-state">
      <p>No passwords found</p>
    </div>
  );

  if (!items || items.length === 0) return <EmptyState />;

  return (
    <div className="password-cards" role="list" aria-label="Password state cards">
      {items.map(item => (
        <div key={item.id} className="password-card" role="listitem" aria-label={item.title}>
          <div className="password-card-header">
            <div className="password-card-info">
              <div className={`icon-circle ${item.color}`}>
                <img src={iconMap[item.id] ?? iconWeakUrl} width="22" height="22" alt={`${item.title} icon`} />
              </div>
              <div className="password-card-title">
                <h3>{item.title}</h3>
              </div>
            </div>
            <button
              onClick={() => onOpenCard(item.id)}
              className="eye-button"
              aria-label={`View ${item.title}`}
            >
              <img src={eyeUrl} className="eye-icon" alt="" />
            </button>
          </div>

          <div className="password-card-content">
            <div className="password-count">{item.count}</div>
            {item.badge?.text && (
              <div className={`badge ${item.badge.variant}`}>
                {item.badge.text}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}



/////////////////////////////////////////////////////////////////////////////////////


// import React, { useState } from 'react';
// import CardDetails from './CardDetails';
// import eyeUrl from '../../../assets/icons/dashboard-icons/eye.svg';
// import iconWeakUrl from '../../../assets/icons/dashboard-icons/icon-weak.svg';
// import iconReusedUrl from '../../../assets/icons/dashboard-icons/icon-reused.svg';
// import iconExposedUrl from '../../../assets/icons/dashboard-icons/icon-exposed.svg';
// import iconOldUrl from '../../../assets/icons/dashboard-icons/icon-old.svg';

// const iconMap = {
//   weak: iconWeakUrl,
//   reused: iconReusedUrl,
//   exposed: iconExposedUrl,
//   old: iconOldUrl,
// };

// export default function PasswordCards({ items = [] }) {
//   const [selectedCard, setSelectedCard] = useState(null);

//   const handleEyeClick = (item) => {
//     setSelectedCard(item);
//   };

//   const handleCloseDetails = () => {
//     setSelectedCard(null);
//   };

//   // Empty state message component
//   const EmptyState = () => (
//     <div className="empty-state">
//       <p>No passwords found</p>
//     </div>
//   );

//   return (
//     <>
//       <div className="password-cards" role="list" aria-label="Password state cards">
//         {items.map(item => (
//           <div key={item.id} className="password-card" role="listitem" aria-label={item.title}>
//             <div className="password-card-header">
//               <div className="password-card-info">
//                 <div className={`icon-circle ${item.color}`}>
//                   <img src={iconMap[item.id]} width="22" height="22" alt={`${item.title} icon`} />
//                 </div>
//                 <div className="password-card-title">
//                   <h3>{item.title}</h3>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => handleEyeClick(item)}
//                 className="eye-button"
//                 aria-label={`View ${item.title}`}
//               >
//                 <img src={eyeUrl} className="eye-icon" alt="" />
//               </button>
//             </div>

//             <div className="password-card-content">
//               <div className="password-count">{item.count}</div>
//               {item.badge?.text && (
//                 <div className={`badge ${item.badge.variant}`}>
//                   {item.badge.text}
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       <CardDetails 
//         isOpen={!!selectedCard}
//         onClose={handleCloseDetails}
//         item={selectedCard}
//       />
//     </>
//   );
// }