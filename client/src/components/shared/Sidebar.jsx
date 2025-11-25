import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Lock,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({
  onOpenPasswordGenerator,
  onOpenProfile,
  onOpenRecoveryKey,
  activeFilter,
  onFilterChange,
  vaultItems = [],
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const getCategoryCounts = () => {
    return {
      "all-items": vaultItems.length,
      favorites: vaultItems.filter((item) => item.favorite).length,
      logins: vaultItems.filter((item) => item.category === "login").length,
      "credit-cards": vaultItems.filter((item) => item.category === "credit_card")
        .length,
      "secure-notes": vaultItems.filter((item) => item.category === "note")
        .length,
      
    };
  };

  const counts = getCategoryCounts();

  const mainNavItems = [
    { id: "my-vault", icon: Shield, label: "My Vault", path: "/my-vault" },
    {
      id: "security-dashboard",
      icon: BarChart3,
      label: "Security Dashboard",
      path: "/security-dashboard",
    },
    {
      id: "authenticator",
      icon: Smartphone,
      label: "Authenticator",
      path: "/authenticator",
    },
    { id: "send", icon: Send, label: "Send", path: "/send" },
    { id: "folders", icon: Folder, label: "Folders", path: "/folders" },
    { id: "archive", icon: Archive, label: "Archive", path: "/archive" },
  ];

  const vaultCategories = [
    {
      id: "all-items",
      icon: Shield,
      label: "All Items",
      count: counts["all-items"],
    },
    {
      id: "favorites",
      icon: Star,
      label: "Favorites",
      count: counts["favorites"],
    },
    { id: "logins", icon: Globe, label: "Logins", count: counts["logins"] },
    {
      id: "credit_card",
      icon: CreditCard,
      label: "Credit Cards",
      count: counts["credit-cards"],
    },
    {
      id: "secure-notes",
      icon: FileText,
      label: "Secure Notes",
      count: counts["secure-notes"],
    }
  ];

  const handleMainNavClick = (path) => {
    navigate(path);
    if (path === "/my-vault" && onFilterChange) {
      onFilterChange("all-items");
    }
  };

  const handleLockVault = () => {
    logout("User manually locked vault");
  };

  const isInVaultSection = location.pathname === "/my-vault";

  const getActiveSection = () => {
    if (location.pathname === "/my-vault") return "my-vault";
    if (location.pathname === "/security-dashboard")
      return "security-dashboard";
    if (location.pathname === "/authenticator") return "authenticator";
    if (location.pathname === "/send") return "send";
    if (location.pathname === "/folders") return "folders";
    if (location.pathname === "/archive") return "archive";
    return "my-vault";
  };

  const activeSection = getActiveSection();

  const handleCategoryClick = (filterId) => {
    if (onFilterChange) {
      onFilterChange(filterId);
      localStorage.setItem("activeFilter", filterId);
    }
  };
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-[#5B6EF5] rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            Lockit
          </h1>
          <p className="text-xs text-gray-500 leading-tight">
            Password Manager
          </p>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="ml-auto lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
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
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className="w-[1.125rem] h-[1.125rem] flex-shrink-0"
                  strokeWidth={2}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Vault Categories */}
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
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className="w-[1.125rem] h-[1.125rem] flex-shrink-0"
                      strokeWidth={2}
                    />
                    <span className="truncate">{category.label}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      isActive
                        ? "bg-white text-gray-900"
                        : "bg-gray-200 text-gray-600"
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
          <Key
            className="w-[1.125rem] h-[1.125rem] flex-shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">Password Generator</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 text-gray-700 hover:bg-gray-50 border border-gray-200"
        >
          <Edit3
            className="w-[1.125rem] h-[1.125rem] flex-shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">View / Edit Profile</span>
        </button>

        <button
          onClick={onOpenRecoveryKey}
          className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 text-gray-700 hover:bg-gray-50 border border-gray-200"
        >
          <Key
            className="w-[1.125rem] h-[1.125rem] flex-shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">Generate Recovery Key</span>
        </button>

        <button
          onClick={handleLockVault}
          className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 text-gray-700 hover:bg-gray-50"
        >
          <Lock
            className="w-[1.125rem] h-[1.125rem] flex-shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">Lock Vault</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col border-r border-gray-100 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-56 xl:w-64 h-screen bg-white flex-col border-r border-gray-100">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;