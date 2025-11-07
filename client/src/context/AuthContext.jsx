import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/apiService";
import InactivityWarning from "../components/shared/InactivityWarning";

const AuthContext = createContext(null);

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: "lockit_session_token",
  USER: "lockit_user_data",
  IS_LOCKED: "lockit_is_locked",
};



export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Initialize state from sessionStorage
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  });

  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.IS_LOCKED) === "true";
  });

  const [vaultKey, setVaultKey] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const hasToken = !!sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const hasUser = !!sessionStorage.getItem(STORAGE_KEYS.USER);
    const locked = sessionStorage.getItem(STORAGE_KEYS.IS_LOCKED) === "true";
    return hasToken && hasUser && !locked;
  });

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  const WARNING_BEFORE_LOCK = 60 * 1000; // 60 seconds

  // Sync state to sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
      apiService.setToken(token);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      apiService.clearToken();
    }
  }, [token]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.IS_LOCKED, isLocked.toString());
  }, [isLocked]);

  // On mount, restore session if token exists
  useEffect(() => {
    const storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = sessionStorage.getItem(STORAGE_KEYS.USER);
    const wasLocked = sessionStorage.getItem(STORAGE_KEYS.IS_LOCKED) === "true";

    if (storedToken && storedUser) {
      apiService.setToken(storedToken);

      // Always redirect to unlock if there's no vault key in memory
      if (!vaultKey || wasLocked) {
        setIsLocked(true);
        setIsAuthenticated(false);
        navigate("/unlock", { replace: true });
      }
    }
  }, [navigate]); // Removed vaultKey from deps to prevent loops

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    setShowInactivityWarning(false);

    if (isAuthenticated && !isLocked) {
      inactivityTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);

        warningTimerRef.current = setTimeout(() => {
          lockVault("Session expired due to inactivity");
        }, WARNING_BEFORE_LOCK);
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOCK);
    }
  };

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated || isLocked) return;

    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [isAuthenticated, isLocked]);

  // Login
  const login = async (usernameOrEmail, masterPassword) => {
    try {
      const data = await apiService.login(usernameOrEmail, masterPassword);

      setToken(data.token);
      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      });

      setVaultKey(data.vaultKey);
      setIsLocked(false);
      setIsAuthenticated(true);

      await apiService.updateLastLogin(data.user.id);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  // Signup
  const signup = async (username, email, masterPassword, recoveryKey) => {
    try {
      const data = await apiService.signup(
        username,
        email,
        masterPassword,
        recoveryKey
      );

      setToken(data.token);
      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      });
      setVaultKey(data.vaultKey);
      setIsLocked(false);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }
  };

  // Lock vault
  const lockVault = (reason = "Vault locked") => {

    // Clear vault key from memory
    setVaultKey(null);
    setIsLocked(true);
    setIsAuthenticated(false);
    setShowInactivityWarning(false);

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Keep token and user data for quick unlock
    navigate("/unlock");
  };

  // Logout
  const logout = async (reason = "User logged out") => {

    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // Clear everything
    apiService.clearToken();
    setToken(null);
    setUser(null);
    setVaultKey(null);
    setIsAuthenticated(false);
    setIsLocked(false);
    setShowInactivityWarning(false);

    // Clear sessionStorage
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.IS_LOCKED);

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    navigate("/unlock");
  };

  // Unlock
  const unlock = async (masterPassword) => {
    try {
      if (!user) {
        throw new Error("No user session found");
      }

      const data = await apiService.login(user.username, masterPassword);

      setVaultKey(data.vaultKey);
      setIsLocked(false);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error("Unlock error:", error);
      return { success: false, error: error.message };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error("No user session found");
      }
      const data = await apiService.updateUser(user.id, updates);
      setUser((prev) => ({ ...prev, ...data.user }));
      return { success: true };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error: error.message };
    }
  };

  // Change master password
  const changeMasterPassword = async (currentPassword, newPassword) => {
    try {
      const data = await apiService.changeMasterPassword(
        user.id,
        currentPassword,
        newPassword
      );

      setVaultKey(data.newVaultKey);

      return { success: true };
    } catch (error) {
      console.error("Change password error:", error);
      return { success: false, error: error.message };
    }
  };

  // Reset password
  const resetPassword = async (usernameOrEmail, recoveryKey, newPassword) => {
    try {
      await apiService.resetPassword(usernameOrEmail, recoveryKey, newPassword);
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: error.message };
    }
  };

  // Generate recovery key
  const generateRecoveryKey = async (masterPassword, recoveryKey) => {
    try {
      await apiService.generateRecoveryKey(
        user.id,
        masterPassword,
        recoveryKey
      );
      return { success: true };
    } catch (error) {
      console.error("Generate recovery key error:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    vaultKey,
    isAuthenticated,
    isLocked,
    login,
    unlock,
    lockVault,
    signup,
    logout,
    updateProfile,
    changeMasterPassword,
    resetPassword,
    generateRecoveryKey,
    resetInactivityTimer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showInactivityWarning && (
        <InactivityWarning
          isOpen={showInactivityWarning}
          remainingSeconds={60}
        />
      )}
    </AuthContext.Provider>
  );
};

