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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // ✅ Initialiser depuis sessionStorage
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [vaultKey, setVaultKey] = useState(() => {
    return sessionStorage.getItem("vaultKey") || null;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("token") || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("isAuthenticated") === "true";
  });

  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem("isLocked") === "true";
  });

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  const WARNING_BEFORE_LOCK = 60 * 1000; // 60 seconds

  // ✅ Synchroniser avec sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    if (vaultKey) {
      sessionStorage.setItem("vaultKey", vaultKey);
    } else {
      sessionStorage.removeItem("vaultKey");
    }
  }, [vaultKey]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("token", token);
      apiService.setToken(token);
    } else {
      sessionStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    sessionStorage.setItem("isAuthenticated", isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    sessionStorage.setItem("isLocked", isLocked.toString());
  }, [isLocked]);

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

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

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
      apiService.setToken(data.token);

      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      });

      setVaultKey(data.vaultKey);
      setIsAuthenticated(true);
      setIsLocked(false);

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
      apiService.setToken(data.token);

      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      });
      setVaultKey(data.vaultKey);
      setIsAuthenticated(true);
      setIsLocked(false);

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }
  };

  // Lock vault
  const lockVault = (reason = "Vault locked") => {
    console.log("Lock reason:", reason);

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

    navigate("/unlock");
  };

  // Logout
  const logout = async (reason = "User logged out") => {
    console.log("Logout reason:", reason);

    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // ✅ Clear sessionStorage
    apiService.clearToken();
    sessionStorage.clear();

    setToken(null);
    setUser(null);
    setVaultKey(null);
    setIsAuthenticated(false);
    setIsLocked(false);
    setShowInactivityWarning(false);

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