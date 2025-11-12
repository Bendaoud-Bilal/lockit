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
          const friendlyMessage = this.formatErrorMessage(error.response);
          throw new Error(friendlyMessage);
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

  formatErrorMessage(response) {
    const errorData = response.data;
    const status = response.status;

    // Use the error message from the backend if it's user-friendly
    let message = errorData.error || errorData.message;

    // Check for Prisma-specific errors and replace with user-friendly messages
    if (message && typeof message === 'string') {
      // Unique constraint violations
      if (message.includes('Unique constraint') || message.includes('unique constraint')) {
        if (message.toLowerCase().includes('username')) {
          return "This username is already taken. Please choose a different one.";
        }
        if (message.toLowerCase().includes('email')) {
          return "This email is already registered. Please use a different one.";
        }
        return "This value is already in use. Please choose a different one.";
      }

      // Foreign key constraint violations
      if (message.includes('Foreign key constraint')) {
        return "Unable to complete this action due to related data.";
      }

      // Record not found
      if (message.includes('Record to update not found') || message.includes('No ')) {
        return "The requested item could not be found.";
      }

      // If the message doesn't contain technical jargon, return it as-is
      if (!message.includes('Prisma') && 
          !message.includes('prisma') && 
          !message.includes('PrismaClient') &&
          !message.includes('constraint') &&
          !message.includes('relation')) {
        return message;
      }
    }

    // Fallback error messages based on status code
    switch (status) {
      case 400:
        return "Invalid request. Please check your input and try again.";
      case 401:
        return "Authentication failed. Please check your credentials.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This item already exists. Please use a different value.";
      case 422:
        return "Invalid data provided. Please check your input.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return `An error occurred (${status}). Please try again.`;
    }
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

  // Vault endpoints
  async getUserCredentials(userId, config = {}) {
    return this.client.get(`/api/vault/credentials/user/${userId}`, config);
  }

  async toggleFavorite(ownerId, credentialId) {
    return this.client.patch(`/api/vault/credentials/${ownerId}/${credentialId}/favorite`);
  }
  
  async deleteCredential(ownerId, credentialId, state) {
    return this.client.delete(`/api/vault/delete-password/${ownerId}/${credentialId}`, {
      params: { state },
    });
  }

  async getArchiveCredentials(userId, config = {}) {
    return this.client.get(`/api/vault/archive-credentials/user/${userId}`, config);
  }
  async getCredentials(userId, filters = {}) {
     const params = new URLSearchParams();
     
     if (filters.folderId) params.append('folderId', filters.folderId);
     if (filters.category) params.append('category', filters.category);
     if (filters.favorite !== undefined) params.append('favorite', filters.favorite);
     if (filters.state) params.append('state', filters.state);
     
     const queryString = params.toString();
     const url = `/api/credentials/${userId}${queryString ? `?${queryString}` : ''}`;
     
     return this.client.get(url);
   }

  async deleteAllCredentials(userId, state) {
    const response = await this.client.delete(`/api/vault/delete-all-passwords/${userId}`, {
      params: { state },
    });
    return response;
  }
   async restoreCredential(ownerId,credentialId){
    return this.client.patch(`/api/vault/credentials/${ownerId}/${credentialId}/restore`)

   }
   async addCredential(encryptedCredential){
    return this.client.post(`/api/vault/credentials`,{encryptedCredential})

   }
   async updateCredential(credentialId,encryptedCredential){
    return this.client.put(`/api/vault/credentials/${credentialId}`,{encryptedCredential})

   }
  get axiosInstance() {
    return this.client;
  }

}

export default new ApiService();
