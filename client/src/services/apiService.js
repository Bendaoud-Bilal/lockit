import axios from "axios";
import APP_CONFIG from "../utils/config";

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: APP_CONFIG.API_BASE_URL,
      timeout: APP_CONFIG.API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error status
          throw new Error(
            error.response.data.error ||
              error.response.data.message ||
              `Error: ${error.response.status}`
          );
        } else if (error.request) {
          // Request made but no response (server down)
          throw new Error(
            "Cannot connect to server. Please ensure the server is running."
          );
        } else {
          // Something else happened
          throw error;
        }
      }
    );

    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Authentication endpoints
  async login(usernameOrEmail, masterPassword) {
    return this.client.post("/api/auth/login", {
      usernameOrEmail,
      masterPassword,
    });
  }

  async signup(username, email, masterPassword, recoveryKey) {
    return this.client.post("/api/auth/signup", {
      username,
      email,
      masterPassword,
      recoveryKey,
    });
  }

  async logout() {
    return this.client.post("/api/auth/logout");
  }

  async verifyRecoveryKey(usernameOrEmail, recoveryKey) {
    return this.client.post("/api/auth/verify-recovery-key", {
      usernameOrEmail,
      recoveryKey,
    });
  }

  async resetPassword(usernameOrEmail, recoveryKey, newPassword) {
    return this.client.post("/api/auth/reset-password", {
      usernameOrEmail,
      recoveryKey,
      newPassword,
    });
  }

  // User endpoints
  async updateUser(userId, updates) {
    return this.client.patch(`/api/users/${userId}`, updates);
  }

  async changeMasterPassword(userId, currentPassword, newPassword) {
    return this.client.post(`/api/users/${userId}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  async updateLastLogin(userId) {
    return this.client.patch(`/api/users/${userId}/last-login`);
  }

  // Recovery Key endpoints
  async generateRecoveryKey(userId, masterPassword, recoveryKey) {
    return this.client.post(`/api/users/${userId}/recovery-key`, {
      masterPassword,
      recoveryKey,
    });
  }

  async getRecoveryKeys(userId) {
    return this.client.get(`/api/users/${userId}/recovery-keys`);
  }
}

export default new ApiService();
