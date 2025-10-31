import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLocked, user } = useAuth();

  // No session at all -> go to unlock/login
  if (!user) {
    return <Navigate to="/unlock" replace />;
  }

  // Session exists but vault is locked -> go to unlock
  if (isLocked || !isAuthenticated) {
    return <Navigate to="/unlock" replace />;
  }

  // Authenticated and unlocked - allow access
  return children;
};

export default ProtectedRoute;
