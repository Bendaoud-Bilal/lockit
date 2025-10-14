import React, { useState } from 'react';
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

const Sidebar = () => {
  const [activeSection, setActiveSection] = useState('my-vault');
  const [activeCategory, setActiveCategory] = useState('all-items');

  const mainNavItems = [
    { id: 'my-vault', icon: Shield, label: 'My Vault' },
    { id: 'security-dashboard', icon: BarChart3, label: 'Security Dashboard' },
    { id: 'authenticator', icon: Smartphone, label: 'Authenticator' },
    { id: 'send', icon: Send, label: 'Send' },
    { id: 'folders', icon: Folder, label: 'Folders' },
    { id: 'archive', icon: Archive, label: 'Archive' },
  ];

  const vaultCategories = [
    { id: 'all-items', icon: Shield, label: 'All Items', count: 6 },
    { id: 'favorites', icon: Star, label: 'Favorites', count: 1 },
    { id: 'logins', icon: Globe, label: 'Logins', count: 4 },
    { id: 'credit-cards', icon: CreditCard, label: 'Credit Cards', count: 1 },
    { id: 'secure-notes', icon: FileText, label: 'Secure Notes', count: 1 },
    { id: 'identities', icon: UserCircle, label: 'Identities', count: 0 },
  ];

  const bottomNavItems = [
    { id: 'password-generator', icon: Key, label: 'Password Generator', hasPopup: true },
    { id: 'view-edit-profile', icon: Edit3, label: 'View / Edit Profile', hasPopup: true },
    { id: 'lock-vault', icon: Lock, label: 'Lock Vault', hasPopup: false },
  ];

  const handleMainNavClick = (itemId) => {
    setActiveSection(itemId);
    if (itemId === 'my-vault') {
      setActiveCategory('all-items');
    }
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setActiveSection('my-vault');
  };

  const isInVaultSection = activeSection === 'my-vault';

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
                onClick={() => handleMainNavClick(item.id)}
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

        {/* Vault Categories - Only show when My Vault is active */}
        {isInVaultSection && (
          <div className="mt-4 space-y-0.5">
            {vaultCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
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
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => console.log(`${item.label} clicked`)}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                item.hasPopup
                  ? 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-[1.125rem] h-[1.125rem] flex-shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;