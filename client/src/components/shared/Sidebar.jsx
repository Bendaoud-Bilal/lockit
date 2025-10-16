import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  BarChart3, 
  Smartphone, 
  Send, 
  Folder, 
  Archive, 
  Globe,
  Star,
  CreditCard,
  FileText,
  UserCircle,
  Key,
  Edit3,
  Lock
} from 'lucide-react';


const Sidebar = ({ onOpenPasswordGenerator, onOpenProfile, activeFilter, onFilterChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems = [
    { id: 'my-vault', icon: Shield, label: 'My Vault', path: '/my-vault' },
    { id: 'security-dashboard', icon: BarChart3, label: 'Security Dashboard', path: '/security-dashboard' },
    { id: 'authenticator', icon: Smartphone, label: 'Authenticator', path: '/authenticator' },
    { id: 'send', icon: Send, label: 'Send', path: '/send' },
    { id: 'folders', icon: Folder, label: 'Folders', path: '/folders' },
    { id: 'archive', icon: Archive, label: 'Archive', path: '/archive' },
  ];

  const vaultCategories = [
    { id: 'all-items', icon: Shield, label: 'All Items', count: 6 },
    { id: 'favorites', icon: Star, label: 'Favorites', count: 1 },
    { id: 'logins', icon: Globe, label: 'Logins', count: 4 },
    { id: 'credit-cards', icon: CreditCard, label: 'Credit Cards', count: 1 },
    { id: 'secure-notes', icon: FileText, label: 'Secure Notes', count: 1 },
    { id: 'identities', icon: UserCircle, label: 'Identities', count: 0 },
  ];

  const handleMainNavClick = (path) => {
    navigate(path);
    // Reset filter when navigating to My Vault
    if (path === '/my-vault' && onFilterChange) {
      onFilterChange('all-items');
    }
  };

  

  const handleLockVault = () => {
    // TODO: Clear auth state/session storage
    navigate('/unlock');
  };

  const isInVaultSection = location.pathname === '/my-vault';
  
  // Determine active section based on current path
  const getActiveSection = () => {
    if (location.pathname === '/my-vault') return 'my-vault';
    if (location.pathname === '/security-dashboard') return 'security-dashboard';
    if (location.pathname === '/authenticator') return 'authenticator';
    if (location.pathname === '/send') return 'send';
    if (location.pathname === '/folders') return 'folders';
    if (location.pathname === '/archive') return 'archive';
    return 'my-vault';
  };

  const activeSection = getActiveSection();

   const handleCategoryClick = (filterId) => {
    if (onFilterChange) {
      onFilterChange(filterId);
      localStorage.setItem('activeFilter', filterId);
    }
  };

  return (
    <div className="w-64 lg:w-56 xl:w-64 h-screen bg-white flex flex-col border-r border-gray-100">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-[#5B6EF5] rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-semibold text-gray-900 leading-tight">Lockit</h1>
          <p className="text-xs text-gray-500 leading-tight">Password Manager</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMainNavClick(item.path)}
                className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-[1.125rem] h-[1.125rem] flex-shrink-0" strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Vault Categories - Only show when My Vault is active (these are filters, not routes) */}
        {isInVaultSection && (
          <div className="mt-4 space-y-0.5">
            {vaultCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeFilter === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full h-10 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-[1.125rem] h-[1.125rem] flex-shrink-0" strokeWidth={2} />
                    <span className="truncate">{category.label}</span>
                  </div>
                  <span 
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      isActive 
                        ? 'bg-white text-gray-900' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-100 space-y-2 flex-shrink-0">
        <button
          onClick={onOpenPasswordGenerator}
          className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 text-gray-700 hover:bg-gray-50 border border-gray-200"
        >
          <Key className="w-[1.125rem] h-[1.125rem] flex-shrink-0" strokeWidth={2} />
          <span className="truncate">Password Generator</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 text-gray-700 hover:bg-gray-50 border border-gray-200"
        >
          <Edit3 className="w-[1.125rem] h-[1.125rem] flex-shrink-0" strokeWidth={2} />
          <span className="truncate">View / Edit Profile</span>
        </button>

        <button
          onClick={handleLockVault}
          className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 text-gray-700 hover:bg-gray-50"
        >
          <Lock className="w-[1.125rem] h-[1.125rem] flex-shrink-0" strokeWidth={2} />
          <span className="truncate">Lock Vault</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;