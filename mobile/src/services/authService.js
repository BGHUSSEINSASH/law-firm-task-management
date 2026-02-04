// mobile/src/services/authService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';

const API_URL = process.env.API_URL || 'https://api.example.com';

class AuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.biometricEnabled = false;
  }

  /**
   * Initialize auth service
   */
  async initialize() {
    try {
      // Restore saved tokens
      const savedTokens = await AsyncStorage.getItem('authTokens');
      if (savedTokens) {
        const { accessToken, refreshToken } = JSON.parse(savedTokens);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
      }

      // Restore user data
      const savedUser = await AsyncStorage.getItem('userData');
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      }

      // Check biometric availability
      this.biometricEnabled = await this.checkBiometricAvailable();

      return { success: true };
    } catch (error) {
      console.error('Auth initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
        deviceId: await this.getDeviceId(),
      });

      const { accessToken, refreshToken, user, requires2FA } = response.data;

      if (requires2FA) {
        return {
          success: false,
          requires2FA: true,
          message: 'Two-factor authentication required',
        };
      }

      // Save tokens
      await this.saveTokens(accessToken, refreshToken);
      this.user = user;
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  /**
   * Biometric login
   */
  async biometricLogin(email) {
    try {
      // Authenticate with device
      const authenticated = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        fallbackLabel: 'Use passcode',
      });

      if (!authenticated.success) {
        return { success: false, error: 'Biometric authentication failed' };
      }

      // Get biometric credential
      const credential = await this.getBiometricCredential(email);
      if (!credential) {
        return { success: false, error: 'Biometric credential not found' };
      }

      // Verify with backend
      const response = await axios.post(
        `${API_URL}/api/biometric/auth/verify`,
        {
          email,
          credentialId: credential.credentialId,
          authenticatorData: credential.authenticatorData,
        }
      );

      const { accessToken, refreshToken, user } = response.data;

      await this.saveTokens(accessToken, refreshToken);
      this.user = user;
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      // Revoke tokens on server
      if (this.accessToken) {
        await axios.post(
          `${API_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
      }

      // Clear local data
      await AsyncStorage.removeItem('authTokens');
      await AsyncStorage.removeItem('userData');

      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async checkBiometricAvailable() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register biometric credential
   */
  async registerBiometric(email) {
    try {
      // Check availability
      if (!this.biometricEnabled) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      // Get enrollment challenge
      const response = await axios.get(
        `${API_URL}/api/biometric/enrollment/start`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const { challenge, supportedMethods } = response.data;

      // Authenticate with device
      const authenticated = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
      });

      if (!authenticated.success) {
        return { success: false, error: 'Authentication failed' };
      }

      // Save credential locally
      const credential = {
        credentialId: challenge,
        email,
        enrolledAt: new Date().toISOString(),
        supportedMethods,
      };

      await AsyncStorage.setItem(
        `biometric_${email}`,
        JSON.stringify(credential)
      );

      return { success: true, message: 'Biometric authentication enabled' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get stored biometric credential
   */
  async getBiometricCredential(email) {
    try {
      const credential = await AsyncStorage.getItem(`biometric_${email}`);
      return credential ? JSON.parse(credential) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { accessToken } = response.data;
      this.accessToken = accessToken;

      // Save updated tokens
      await AsyncStorage.setItem(
        'authTokens',
        JSON.stringify({
          accessToken,
          refreshToken: this.refreshToken,
        })
      );

      return { success: true };
    } catch (error) {
      // Refresh failed, logout user
      await this.logout();
      return { success: false, error: error.message };
    }
  }

  /**
   * Save tokens securely
   */
  async saveTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    await AsyncStorage.setItem(
      'authTokens',
      JSON.stringify({ accessToken, refreshToken })
    );
  }

  /**
   * Get device ID (for device binding)
   */
  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');

      if (!deviceId) {
        // Generate new device ID
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('deviceId', deviceId);
      }

      return deviceId;
    } catch (error) {
      return 'unknown-device';
    }
  }
}

export default new AuthService();
